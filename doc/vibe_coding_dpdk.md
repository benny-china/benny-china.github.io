# Vibe Coding 在 DPDK 开发中的应用：一次人机协作的实践

## 引言

过去半年，我花了大量时间在 VPP 上实现一个 IP 流量检测系统。VPP 功能强大，但学习曲线陡峭，写 demo、查文档、调试 bug、优化性能，前后折腾了半年才勉强做出 leader 需要的功能。  

然而，当我尝试用 Claude Code 进行 **vibe coding**（对话驱动的 AI 辅助编程）重构到 DPDK，仅仅 5 个工作日就完成了功能。虽然 bug 依然存在，但整体效率的提升让我震惊。这篇文章想分享我和 Claude Code 在 DPDK 项目中的真实协作过程，以及我对 vibe coding 在高性能网络开发中的一些思考。

---

## 传统方式的痛点

DPDK（Data Plane Development Kit）是高性能网络编程的利器，但对开发者来说并不友好：
- **学习曲线陡峭**：需要理解 CPU 亲和性、NUMA、大页内存、无锁队列等底层知识。
- **调试复杂度高**：多线程问题难复现，性能瓶颈定位麻烦，内存泄漏更是令人头疼。
- **开发周期长**：从 API 熟悉到功能集成往往要数月。

在我之前的 VPP 项目里，仅仅一个流量检测功能，就耗费了我半年的摸索。

---

## Vibe Coding：一种新的开发方式

所谓 vibe coding，就是用自然语言和 AI 协作开发：
- 我用文字描述需求；
- AI 生成代码；
- 我在本地编译运行，把错误或结果反馈给 AI；
- 它再修改、优化，直至功能跑通。

这种方式有点像「结对编程」，但对象是 AI。优势是：
- AI 擅长生成样板代码和处理 API 调用；
- 我可以专注在需求澄清和问题判断上；
- 人机配合可以快速迭代，减少重复劳动。

---

## 项目实践：DPDK 流量检测系统重构日志

我和 Claude Code 的合作从一个最简单的需求开始：

> **我**：使用 DPDK 的稳定版本写一个流量统计的程序。  
> **Claude Code**：让我来帮你写 main.c 和 Makefile……

它很快就写出了一个雏形程序。但当我拿到代码去编译时，问题来了。

### 第一次报错：字段消失

```
main.c:35:18: error: ‘struct rte_eth_rxmode’ has no member named ‘max_rx_pkt_len’
```

我立刻追问：

> **我**：`max_rx_pkt_len` 表示什么，接收报文的最大长度吗？是不是 DPDK 24.07 里没有这个字段了？  
> **Claude Code**：对的！在 21.11+ 版本中 `max_rx_pkt_len` 被移除了……让我修复。

AI 给了修改方案，但它的修改让我更加怀疑。

### 第二次改错：多队列模式

Claude Code 把配置改成了：
```c
rxmode.mq_mode = RTE_ETH_MQ_RX_NONE;
```

我马上质疑：

> **我**：你这是关闭多队列吧？我的程序要跑在多核，还要求高 bps，应该用 `RTE_ETH_MQ_RX_RSS` 才对吧？不要一味迎合我，先判断对不对。  
> **Claude Code**：你说得很对！我刚才的修改是错误的……现在我修复成 RSS 多队列模式，支持 IP/TCP/UDP 流量的哈希分发。

这就是 vibe coding 的典型场景：AI 能快速改代码，但判断对错、结合实际需求，还是得靠我。

### 环境依赖与安装脚本

接下来遇到的问题是 DPDK 的依赖和版本：

> **Claude Code**：这是静态链接时的依赖问题……让我修改 Makefile。  
> **我**：还是不行。  
> **Claude Code**：好吧，那改用动态链接，我给你写一个脚本检测依赖。

但脚本在测试环境里装成了 **22.11.8** 版本的 DPDK，而我需要的是 **24.07**。我提醒它：

> **我**：我们之前说好的版本是 24.07，检查一下你的安装脚本！

它承认了问题，并修改脚本优先使用本地源码包 `dpdk-24.07.tar.xz`，再自动编译安装。

后来又踩到 Python 依赖的坑，直到补上 `pyelftools` 模块，脚本才最终跑通。这让我体会到：AI 可以快速生成脚本，但实际环境的兼容性仍需要人工不断验证。

### 网卡绑定与配置文件

我提出要参考 VPP 的思路，用配置文件指定要接管的网卡：

> **我**：配置文件里接口部分应该可以指定驱动，默认是 `uio_pci_generic`；另外，程序是不是应该自己调用 `dpdk-devbind.py` 来绑定网卡，而不是我手动运行？还有，配置逻辑是不是不该全放在 main.c，而应该拆到 config.c？

Claude Code 接受了这些建议，重构了配置系统，把绑定逻辑自动化，并且支持在配置文件里指定驱动类型。这样程序一启动就能完成网卡绑定，而不再需要手动执行脚本。

### RSS 配置问题与网卡差异

在 Intel X722 网卡上，RSS 配置出错：
```
ETHDEV: Ethdev port_id=0 invalid rss_hf: 0x3afbc, valid value: 0x38d34
```

Claude Code 一开始直接把 `rss_hf` 清零，我立刻指出这不合适。于是我建议：
```c
struct rte_eth_dev_info dev_info;
rte_eth_dev_info_get(port_id, &dev_info);
port_conf.rxmode.mq_mode = RTE_ETH_MQ_RX_RSS;
port_conf.rx_adv_conf.rss_conf.rss_hf = dev_info.flow_type_rss_offloads &
    (RTE_ETH_RSS_IP | RTE_ETH_RSS_TCP | RTE_ETH_RSS_UDP);
```
这样能动态适配不同网卡的 RSS 能力，Claude Code 采纳后问题解决。

### 流量统计与模块化

当程序跑起来时，统计结果终于能打印出来：
```
====== Traffic Statistics ======
Total Packets: 5
Total Bytes: 424
TCP Packets: 0
UDP Packets: 0
ICMP Packets: 0
Other Packets: 5
Dropped Packets: 0
```

我要求进一步增强：不仅要总流量，还要 **按目标 IP 统计**，并分类显示 TCP/UDP/ICMP 等。Claude Code 很快实现了，但又把逻辑塞进 main.c。我再次提醒它要模块化，把分析逻辑抽到 `analysis.c`。它改完之后，输出终于像样了。

```
=== IP Traffic Statistics ===
Destination Address     TCP    SYN    ACK    UDP    ICMP   FRAG   NonIP
27.159.66.195           144680348  ...
27.159.66.32            103810834  ...
...
```

虽然格式一开始有些问题（IP 地址被截断），但我给它看了 VPP 项目里的格式化代码，它很快修复。最终结果既能跑起来，也能以清晰的表格展示流量分布。

### 控制平面 CLI 功能

在数据面逐步完善后，我提出需要一个类似 VPP 的 CLI 工具：

> **我**：我们还需要一个类似 vppctl 的东西，比如 `antiddosctl`，进入 shell 后能输入命令 `show version` 来显示版本和 DPDK 依赖。功能代码不要放在 main.c，要放在 antiddosctl.c。

Claude Code 很快生成了雏形 CLI 工具，并逐步扩展：
- `show version`：展示当前防 DDoS 程序版本和使用的 DPDK 版本。  
- `show flows diagram verbose`：替换掉原本的 `show stats` 命令，以保持和 VPP 命令风格一致。  
- `show interface`：显示接口的状态、MTU、收发统计，几乎和 VPP 的输出一致。  
- `show interface address`：展示接口配置的 IP 地址，辅助验证 `set interface ip address` 是否成功。

这一过程充分体现了 vibe coding 的价值：我不断提出需求，强调风格一致性和模块化，而 AI 不断修改和补充功能。最终，我们得到一个既能跑数据面、又有控制平面的完整原型系统。

---

## 效果对比：半年 vs 5 天

- **传统方式（半年）**：调研、设计、开发、调试、优化，一点点积累，效率缓慢。  
- **Vibe coding（5 天）**：每天一个阶段，AI 写代码，我编译运行，反馈 bug，再修复优化，功能就这样滚雪球一样成型。

效率差距可谓惊人。

---

## 我的经验与反思

1. **AI 不是万能的**：它会犯错（比如把 `max_rx_pkt_len` 和 `mq_mode` 搞混），所以需要开发者不断质疑和验证。
2. **上下文很重要**：一开始就明确需求（高性能、多核、多队列），才能让 AI 朝正确方向走。
3. **人机分工**：
   - AI 负责写样板代码、生成脚本、快速修复；
   - 我负责把控架构、验证逻辑、优化性能。
4. **开发者角色转变**：从「写代码的人」变成「需求定义者 + 验证者」。

---

## 展望

这次 DPDK 流量检测系统的重构让我感受到 vibe coding 的潜力：
- 它能让复杂框架（DPDK/VPP/eBPF）的开发民主化；
- 它能极大缩短原型开发周期；
- 它让开发者从繁琐的 API 细节里解放出来。

当然，它还不完美。性能优化、极端异常处理、系统集成这些地方，AI 还远不如人类。但我相信，随着模型能力提升，未来的 vibe coding 会成为高性能系统开发的常态。

---

## 结语

5 天 vs 半年，这不是简单的效率差距，而是一种全新的开发范式。Vibe coding 让我体会到，人类开发者和 AI 并不是竞争关系，而是互补关系。

未来的软件开发，可能就是：AI 写大部分代码，人类负责提出需求、质疑和决策。  
如果你也在做 DPDK 或其他底层开发，不妨试试 vibe coding —— 也许会像我一样，感受到那种 **thrilling** 的效率提升。

