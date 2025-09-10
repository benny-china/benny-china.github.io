class AnalyticsTracker {
    constructor() {
        this.storageKey = 'siteAnalytics';
        this.init();
    }

    init() {
        this.loadAnalytics();
        this.trackVisit();
    }

    loadAnalytics() {
        const stored = localStorage.getItem(this.storageKey);
        this.analytics = stored ? JSON.parse(stored) : {
            totalVisits: 0,
            uniqueVisitors: new Set(),
            countries: {},
            dailyVisits: {},
            firstVisit: new Date().toISOString(),
            lastVisit: null
        };

        if (this.analytics.uniqueVisitors instanceof Array) {
            this.analytics.uniqueVisitors = new Set(this.analytics.uniqueVisitors);
        }
    }

    saveAnalytics() {
        const toSave = {
            ...this.analytics,
            uniqueVisitors: Array.from(this.analytics.uniqueVisitors)
        };
        localStorage.setItem(this.storageKey, JSON.stringify(toSave));
    }

    async getVisitorInfo() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            
            return {
                ip: data.ip,
                country: data.country_name || 'Unknown',
                countryCode: data.country_code || 'XX',
                city: data.city || 'Unknown',
                region: data.region || 'Unknown'
            };
        } catch (error) {
            console.warn('Failed to get visitor info:', error);
            return {
                ip: 'Unknown',
                country: 'Unknown',
                countryCode: 'XX',
                city: 'Unknown',
                region: 'Unknown'
            };
        }
    }

    async trackVisit() {
        const visitorInfo = await this.getVisitorInfo();
        const today = new Date().toDateString();
        const visitorId = visitorInfo.ip || `visitor_${Date.now()}`;

        this.analytics.totalVisits++;
        this.analytics.uniqueVisitors.add(visitorId);
        this.analytics.lastVisit = new Date().toISOString();

        if (this.analytics.countries[visitorInfo.country]) {
            this.analytics.countries[visitorInfo.country]++;
        } else {
            this.analytics.countries[visitorInfo.country] = 1;
        }

        if (this.analytics.dailyVisits[today]) {
            this.analytics.dailyVisits[today]++;
        } else {
            this.analytics.dailyVisits[today] = 1;
        }

        this.saveAnalytics();
    }

    getStats() {
        return {
            totalVisits: this.analytics.totalVisits,
            uniqueVisitors: this.analytics.uniqueVisitors.size,
            countries: this.analytics.countries,
            dailyVisits: this.analytics.dailyVisits,
            firstVisit: this.analytics.firstVisit,
            lastVisit: this.analytics.lastVisit
        };
    }

    clearStats() {
        localStorage.removeItem(this.storageKey);
        this.analytics = {
            totalVisits: 0,
            uniqueVisitors: new Set(),
            countries: {},
            dailyVisits: {},
            firstVisit: new Date().toISOString(),
            lastVisit: null
        };
        this.saveAnalytics();
    }
}

if (typeof window !== 'undefined') {
    window.analyticsTracker = new AnalyticsTracker();
}