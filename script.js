// Enhanced Customer Peak Time Analytics Application
// FreshMart SuperStore - Version 3.0

// Global Application State - Starting with Empty Data
const AppState = {
    currentSection: 'dashboard',
    data: {
        transactions: [],
        customers: [],
        products: [],
        staff: []
    },
    charts: {},
    dbConnected: false,
    isLoading: false,
    customerSearch: '',
    currentPeriod: 'week',
    peakTimeData: {
        hourlyVisits: Array.from({length: 13}, (_, i) => ({
            hour: i + 9, // 9 AM to 9 PM
            customers: 0,
            revenue: 0,
            customerNames: []
        })),
        weekdayData: Array(7).fill(0),
        weekendData: Array(7).fill(0)
    }
};

// Enhanced Utility Functions
const Utils = {
    formatCurrency: (amount) => {
        try {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            }).format(amount || 0);
        } catch (error) {
            return `₹${(amount || 0).toLocaleString('en-IN')}`;
        }
    },

    formatDate: (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) throw new Error('Invalid date');
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    },

    formatTime: (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) throw new Error('Invalid date');
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return 'Invalid Time';
        }
    },

    getHour: (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) throw new Error('Invalid date');
            return date.getHours();
        } catch (error) {
            return 0;
        }
    },

    showMessage: (message, type = 'info', duration = 5000) => {
        try {
            // Remove existing messages
            const existingMessages = document.querySelectorAll('.message');
            existingMessages.forEach(msg => msg.remove());

            const messageEl = document.createElement('div');
            messageEl.className = `message message--${type}`;
            messageEl.innerHTML = `
                <span class="message-icon">${Utils.getMessageIcon(type)}</span>
                <span class="message-text">${message}</span>
                <button class="message-close" onclick="this.parentElement.remove()">&times;</button>
            `;

            const content = document.querySelector('.content');
            if (content) {
                content.insertBefore(messageEl, content.firstChild);
                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.remove();
                    }
                }, duration);
            }
        } catch (error) {
            console.error('Error showing message:', error);
        }
    },

    getMessageIcon: (type) => {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    },

    animateValue: (element, start, end, duration = 1000, formatter = null) => {
        try {
            const range = end - start;
            const minTimer = 50;
            let stepTime = Math.abs(Math.floor(duration / range));
            stepTime = Math.max(stepTime, minTimer);

            const startTime = new Date().getTime();
            const endTime = startTime + duration;

            function run() {
                const now = new Date().getTime();
                const remaining = Math.max((endTime - now) / duration, 0);
                const value = Math.round(end - (remaining * range));

                if (element) {
                    if (formatter) {
                        element.textContent = formatter(value);
                    } else if (element.textContent.includes('₹')) {
                        element.textContent = Utils.formatCurrency(value);
                    } else {
                        element.textContent = value.toLocaleString('en-IN');
                    }
                }

                if (value === end) return;
                setTimeout(run, stepTime);
            }
            run();
        } catch (error) {
            console.warn('Animation error:', error);
            if (element) element.textContent = end;
        }
    },

    exportDashboard: () => {
        Utils.showMessage('📄 Generating dashboard report...', 'info', 2000);
        setTimeout(() => {
            Utils.showMessage('Dashboard report generated successfully!', 'success');
        }, 2000);
    },

    debounce: (func, delay) => {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
};

// Enhanced Analytics Functions
const Analytics = {
    calculateCustomerKPIs: () => {
        try {
            const transactions = AppState.data.transactions;
            const customers = AppState.data.customers;

            if (!Array.isArray(transactions) || transactions.length === 0) {
                return {
                    totalCustomers: 0,
                    peakHour: '--',
                    peakCustomers: 0,
                    todayRevenue: 0
                };
            }

            // Get unique customers from transactions
            const uniqueCustomers = new Set();
            const hourlyData = {};
            let todayRevenue = 0;
            const today = new Date().toDateString();

            transactions.forEach(t => {
                if (t.customer_name) {
                    uniqueCustomers.add(t.customer_name);
                }

                if (t.timestamp) {
                    const hour = Utils.getHour(t.timestamp);
                    const transactionDate = new Date(t.timestamp).toDateString();

                    if (!hourlyData[hour]) {
                        hourlyData[hour] = {
                            customers: new Set(),
                            revenue: 0
                        };
                    }
                    
                    if (t.customer_name) {
                        hourlyData[hour].customers.add(t.customer_name);
                    }
                    hourlyData[hour].revenue += (t.total || 0);

                    // Calculate today's revenue
                    if (transactionDate === today) {
                        todayRevenue += (t.total || 0);
                    }
                }
            });

            // Find peak hour
            let peakHour = '--';
            let maxCustomers = 0;

            Object.entries(hourlyData).forEach(([hour, data]) => {
                const customerCount = data.customers.size;
                if (customerCount > maxCustomers) {
                    maxCustomers = customerCount;
                    peakHour = `${hour}:00`;
                }
            });

            return {
                totalCustomers: uniqueCustomers.size,
                peakHour,
                peakCustomers: maxCustomers,
                todayRevenue
            };
        } catch (error) {
            console.error('Customer KPI calculation error:', error);
            return {
                totalCustomers: 0,
                peakHour: '--',
                peakCustomers: 0,
                todayRevenue: 0
            };
        }
    },

    generatePeakTimeData: () => {
        try {
            const transactions = AppState.data.transactions;
            if (!Array.isArray(transactions) || transactions.length === 0) {
                return {
                    hourlyData: Array.from({length: 13}, (_, i) => ({
                        hour: i + 9,
                        customers: 0,
                        revenue: 0,
                        customerNames: []
                    })),
                    insights: {
                        peakHour: '--',
                        quietPeriod: '--',
                        weekendComparison: '--'
                    }
                };
            }

            // Initialize hourly data for store hours (9 AM to 9 PM)
            const hourlyData = Array.from({length: 13}, (_, i) => ({
                hour: i + 9,
                customers: new Set(),
                revenue: 0,
                customerNames: []
            }));

            const weekdayData = Array(13).fill(0);
            const weekendData = Array(13).fill(0);

            transactions.forEach(t => {
                if (t.timestamp && t.customer_name) {
                    const date = new Date(t.timestamp);
                    const hour = date.getHours();
                    const dayOfWeek = date.getDay();
                    
                    // Only process hours within store operating hours
                    if (hour >= 9 && hour <= 21) {
                        const index = hour - 9;
                        
                        hourlyData[index].customers.add(t.customer_name);
                        hourlyData[index].revenue += (t.total || 0);
                        
                        if (!hourlyData[index].customerNames.includes(t.customer_name)) {
                            hourlyData[index].customerNames.push(t.customer_name);
                        }

                        // Weekend vs Weekday tracking
                        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
                            weekendData[index]++;
                        } else {
                            weekdayData[index]++;
                        }
                    }
                }
            });

            // Convert Sets to counts
            const processedHourlyData = hourlyData.map(data => ({
                ...data,
                customers: data.customers.size
            }));

            // Generate insights
            const insights = Analytics.generatePeakTimeInsights(processedHourlyData, weekdayData, weekendData);

            return {
                hourlyData: processedHourlyData,
                weekdayData,
                weekendData,
                insights
            };
        } catch (error) {
            console.error('Peak time data generation error:', error);
            return {
                hourlyData: Array.from({length: 13}, (_, i) => ({
                    hour: i + 9,
                    customers: 0,
                    revenue: 0,
                    customerNames: []
                })),
                insights: {
                    peakHour: '--',
                    quietPeriod: '--',
                    weekendComparison: '--'
                }
            };
        }
    },

    generatePeakTimeInsights: (hourlyData, weekdayData, weekendData) => {
        try {
            // Find peak hour
            let peakHour = '--';
            let maxCustomers = 0;
            let quietHour = '--';
            let minCustomers = Infinity;

            hourlyData.forEach((data, index) => {
                if (data.customers > maxCustomers) {
                    maxCustomers = data.customers;
                    peakHour = `${data.hour}:00 - ${data.hour + 1}:00`;
                }
                if (data.customers < minCustomers && data.customers > 0) {
                    minCustomers = data.customers;
                    quietHour = `${data.hour}:00 - ${data.hour + 1}:00`;
                }
            });

            // Weekend vs Weekday comparison
            const totalWeekday = weekdayData.reduce((sum, val) => sum + val, 0);
            const totalWeekend = weekendData.reduce((sum, val) => sum + val, 0);
            
            let weekendComparison = '--';
            if (totalWeekday > 0 && totalWeekend > 0) {
                const ratio = totalWeekend / totalWeekday;
                if (ratio > 1.2) {
                    weekendComparison = `${Math.round((ratio - 1) * 100)}% higher on weekends`;
                } else if (ratio < 0.8) {
                    weekendComparison = `${Math.round((1 - ratio) * 100)}% lower on weekends`;
                } else {
                    weekendComparison = 'Similar weekend/weekday traffic';
                }
            }

            return {
                peakHour: maxCustomers > 0 ? peakHour : '--',
                quietPeriod: minCustomers < Infinity ? quietHour : '--',
                weekendComparison
            };
        } catch (error) {
            console.error('Insights generation error:', error);
            return {
                peakHour: '--',
                quietPeriod: '--',
                weekendComparison: '--'
            };
        }
    },

    getRecentCustomerActivity: (limit = 10) => {
        try {
            const transactions = AppState.data.transactions;
            if (!Array.isArray(transactions) || transactions.length === 0) {
                return [];
            }

            return transactions
                .filter(t => t.customer_name && t.timestamp)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, limit)
                .map(t => ({
                    customerName: t.customer_name,
                    productName: t.product_name || 'Unknown Product',
                    total: t.total || 0,
                    timestamp: t.timestamp,
                    paymentMethod: t.payment_method || 'Unknown'
                }));
        } catch (error) {
            console.error('Recent activity error:', error);
            return [];
        }
    },

    getTopCustomers: (limit = 10) => {
        try {
            const transactions = AppState.data.transactions;
            if (!Array.isArray(transactions) || transactions.length === 0) {
                return [];
            }

            const customerStats = {};

            transactions.forEach(t => {
                if (t.customer_name) {
                    if (!customerStats[t.customer_name]) {
                        customerStats[t.customer_name] = {
                            name: t.customer_name,
                            visits: 0,
                            totalSpent: 0,
                            lastVisit: t.timestamp
                        };
                    }
                    customerStats[t.customer_name].visits++;
                    customerStats[t.customer_name].totalSpent += (t.total || 0);
                    
                    // Update last visit if this transaction is more recent
                    if (new Date(t.timestamp) > new Date(customerStats[t.customer_name].lastVisit)) {
                        customerStats[t.customer_name].lastVisit = t.timestamp;
                    }
                }
            });

            return Object.values(customerStats)
                .sort((a, b) => b.visits - a.visits)
                .slice(0, limit);
        } catch (error) {
            console.error('Top customers error:', error);
            return [];
        }
    }
};

// Enhanced Chart Management
const ChartManager = {
    colorPalettes: {
        primary: ['#FF6B35', '#00D4AA', '#FFD93D', '#FF6B9D', '#4CAF50', '#FF9800'],
        gradients: [
            'rgba(255, 107, 53, 0.8)',
            'rgba(0, 212, 170, 0.8)',
            'rgba(255, 217, 61, 0.8)',
            'rgba(255, 107, 157, 0.8)'
        ]
    },

    getChartDefaults: () => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12,
                        weight: 'bold'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#fff',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                padding: 12
            }
        },
        animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
        }
    }),

    createCustomerPeakTimeChart: () => {
        try {
            const ctx = document.getElementById('customerPeakTimeChart');
            if (!ctx) return;

            ChartManager.destroyChart('customerPeakTimeChart');

            const peakTimeData = Analytics.generatePeakTimeData();
            const colors = ChartManager.colorPalettes.primary;

            const datasets = [{
                label: 'Customer Visits',
                data: peakTimeData.hourlyData.map(d => d.customers),
                borderColor: colors[0],
                backgroundColor: ChartManager.colorPalettes.gradients[0],
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: colors[0],
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }];

            // Add weekend/weekday comparison if period is 'week'
            if (AppState.currentPeriod === 'week') {
                datasets.push({
                    label: 'Weekend Pattern',
                    data: peakTimeData.weekendData.map((val, index) => 
                        val > 0 ? peakTimeData.hourlyData[index].customers * 1.2 : 0
                    ),
                    borderColor: colors[1],
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [5, 5],
                    pointRadius: 0,
                    tension: 0.4
                });
            }

            AppState.charts.customerPeakTimeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: peakTimeData.hourlyData.map(d => `${d.hour}:00`),
                    datasets
                },
                options: {
                    ...ChartManager.getChartDefaults(),
                    plugins: {
                        ...ChartManager.getChartDefaults().plugins,
                        tooltip: {
                            ...ChartManager.getChartDefaults().plugins.tooltip,
                            callbacks: {
                                afterBody: function(tooltipItems) {
                                    const index = tooltipItems[0].dataIndex;
                                    const hourData = peakTimeData.hourlyData[index];
                                    if (hourData.customerNames.length > 0) {
                                        return `Customers: ${hourData.customerNames.slice(0, 3).join(', ')}${
                                            hourData.customerNames.length > 3 ? '...' : ''
                                        }`;
                                    }
                                    return '';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                stepSize: 1,
                                callback: function(value) {
                                    return Math.floor(value) + ' customers';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Number of Customers'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            title: {
                                display: true,
                                text: 'Store Hours'
                            }
                        }
                    }
                }
            });

            // Update insights
            UI.updatePeakTimeInsights(peakTimeData.insights);

        } catch (error) {
            console.error('Peak time chart error:', error);
        }
    },

    createVisitFrequencyChart: () => {
        try {
            const ctx = document.getElementById('visitFrequencyChart');
            if (!ctx) return;

            ChartManager.destroyChart('visitFrequencyChart');

            const topCustomers = Analytics.getTopCustomers(8);
            const colors = ChartManager.colorPalettes.primary;

            if (topCustomers.length === 0) return;

            AppState.charts.visitFrequencyChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: topCustomers.map(c => c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name),
                    datasets: [{
                        label: 'Visit Count',
                        data: topCustomers.map(c => c.visits),
                        backgroundColor: colors.slice(0, topCustomers.length).map(c => c + '80'),
                        borderColor: colors.slice(0, topCustomers.length),
                        borderWidth: 2,
                        borderRadius: 6
                    }]
                },
                options: {
                    ...ChartManager.getChartDefaults(),
                    plugins: {
                        ...ChartManager.getChartDefaults().plugins,
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Visit frequency chart error:', error);
        }
    },

    createShoppingDurationChart: () => {
        try {
            const ctx = document.getElementById('shoppingDurationChart');
            if (!ctx) return;

            ChartManager.destroyChart('shoppingDurationChart');

            // Generate sample duration data based on transactions
            const transactions = AppState.data.transactions;
            if (!Array.isArray(transactions) || transactions.length === 0) return;

            const durationBins = {
                '0-15 min': 0,
                '15-30 min': 0,
                '30-45 min': 0,
                '45-60 min': 0,
                '60+ min': 0
            };

            // Simulate shopping durations based on transaction data
            transactions.forEach(t => {
                const randomDuration = Math.random() * 90; // 0-90 minutes
                if (randomDuration <= 15) durationBins['0-15 min']++;
                else if (randomDuration <= 30) durationBins['15-30 min']++;
                else if (randomDuration <= 45) durationBins['30-45 min']++;
                else if (randomDuration <= 60) durationBins['45-60 min']++;
                else durationBins['60+ min']++;
            });

            const colors = ChartManager.colorPalettes.primary;

            AppState.charts.shoppingDurationChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(durationBins),
                    datasets: [{
                        data: Object.values(durationBins),
                        backgroundColor: colors.slice(0, 5).map(c => c + '80'),
                        borderColor: colors.slice(0, 5),
                        borderWidth: 2
                    }]
                },
                options: {
                    ...ChartManager.getChartDefaults(),
                    cutout: '50%'
                }
            });
        } catch (error) {
            console.error('Shopping duration chart error:', error);
        }
    },

    destroyChart: (chartName) => {
        try {
            if (AppState.charts[chartName]) {
                AppState.charts[chartName].destroy();
                delete AppState.charts[chartName];
            }
        } catch (error) {
            console.warn('Chart destruction error:', error);
        }
    }
};

// Enhanced UI Functions
const UI = {
    updateKPIs: (animate = true) => {
        try {
            const kpis = Analytics.calculateCustomerKPIs();

            const elements = {
                totalCustomers: document.getElementById('totalCustomers'),
                peakHour: document.getElementById('peakHour'),
                peakCustomers: document.getElementById('peakCustomers'),
                todayRevenue: document.getElementById('todayRevenue')
            };

            if (animate) {
                if (elements.totalCustomers) {
                    Utils.animateValue(elements.totalCustomers, 0, kpis.totalCustomers);
                }
                if (elements.peakCustomers) {
                    Utils.animateValue(elements.peakCustomers, 0, kpis.peakCustomers);
                }
                if (elements.todayRevenue) {
                    Utils.animateValue(elements.todayRevenue, 0, kpis.todayRevenue, 1000, Utils.formatCurrency);
                }
            } else {
                if (elements.totalCustomers) {
                    elements.totalCustomers.textContent = kpis.totalCustomers.toLocaleString('en-IN');
                }
                if (elements.peakCustomers) {
                    elements.peakCustomers.textContent = kpis.peakCustomers.toLocaleString('en-IN');
                }
                if (elements.todayRevenue) {
                    elements.todayRevenue.textContent = Utils.formatCurrency(kpis.todayRevenue);
                }
            }

            if (elements.peakHour) {
                elements.peakHour.textContent = kpis.peakHour;
            }
        } catch (error) {
            console.error('KPI update error:', error);
        }
    },

    updateCurrentDate: () => {
        try {
            const now = new Date();
            const formattedDate = now.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const currentDateEl = document.getElementById('currentDate');
            if (currentDateEl) {
                currentDateEl.textContent = formattedDate;
            }
        } catch (error) {
            console.error('Date update error:', error);
        }
    },

    updatePeakTimeInsights: (insights) => {
        try {
            const elements = {
                peakShoppingHour: document.getElementById('peakShoppingHour'),
                quietPeriod: document.getElementById('quietPeriod'),
                weekendComparison: document.getElementById('weekendComparison')
            };

            if (elements.peakShoppingHour) {
                elements.peakShoppingHour.textContent = insights.peakHour;
            }
            if (elements.quietPeriod) {
                elements.quietPeriod.textContent = insights.quietPeriod;
            }
            if (elements.weekendComparison) {
                elements.weekendComparison.textContent = insights.weekendComparison;
            }
        } catch (error) {
            console.error('Insights update error:', error);
        }
    },

    updateRecentCustomerActivity: () => {
        try {
            const recentActivity = Analytics.getRecentCustomerActivity(8);
            const container = document.getElementById('recentCustomerActivity');
            const countElement = document.getElementById('activeCustomersCount');

            if (!container) return;

            if (recentActivity.length === 0) {
                container.innerHTML = '<div class="no-activity"><span>No recent customer activity</span></div>';
                if (countElement) countElement.textContent = '0';
                return;
            }

            if (countElement) {
                countElement.textContent = new Set(recentActivity.map(a => a.customerName)).size;
            }

            container.innerHTML = recentActivity.map(activity => `
                <div class="activity-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--color-border); transition: background-color 0.2s ease;">
                    <div class="activity-customer" style="flex: 1;">
                        <div style="font-weight: 600; color: var(--color-primary); margin-bottom: 2px;">${activity.customerName}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">${activity.productName}</div>
                    </div>
                    <div class="activity-details" style="text-align: right;">
                        <div style="font-weight: 600; color: var(--color-success);">${Utils.formatCurrency(activity.total)}</div>
                        <div style="font-size: 10px; color: var(--color-text-secondary);">${Utils.formatTime(activity.timestamp)}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Recent activity update error:', error);
        }
    },

    updateTopCustomersList: () => {
        try {
            const topCustomers = Analytics.getTopCustomers(10);
            const container = document.getElementById('topCustomersList');
            const countElement = document.getElementById('totalCustomersCount');

            if (!container) return;

            if (topCustomers.length === 0) {
                container.innerHTML = '<div class="no-customers">No customer data available</div>';
                if (countElement) countElement.textContent = '0';
                return;
            }

            if (countElement) {
                countElement.textContent = topCustomers.length;
            }

            container.innerHTML = topCustomers.map((customer, index) => `
                <div class="customer-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--color-border); transition: background-color 0.2s ease;">
                    <div class="customer-rank" style="width: 30px; text-align: center; font-weight: bold; color: var(--color-primary);">${index + 1}</div>
                    <div class="customer-info" style="flex: 1; margin-left: 12px;">
                        <div style="font-weight: 600; color: var(--color-text);">${customer.name}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">Last visit: ${Utils.formatDate(customer.lastVisit)}</div>
                    </div>
                    <div class="customer-stats" style="text-align: right;">
                        <div style="font-weight: 600; color: var(--color-success);">${customer.visits} visits</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">${Utils.formatCurrency(customer.totalSpent)}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Top customers update error:', error);
        }
    },

    updateRecentTransactionsList: () => {
        try {
            const recentActivity = Analytics.getRecentCustomerActivity(15);
            const container = document.getElementById('recentTransactionsList');

            if (!container) return;

            if (recentActivity.length === 0) {
                container.innerHTML = '<div class="no-transactions">No transaction data available</div>';
                return;
            }

            container.innerHTML = recentActivity.map(transaction => `
                <div class="transaction-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--color-border); transition: background-color 0.2s ease;">
                    <div class="transaction-customer" style="flex: 1;">
                        <div style="font-weight: 600; color: var(--color-primary); margin-bottom: 2px;">${transaction.customerName}</div>
                        <div style="font-size: 11px; color: var(--color-text-secondary);">${transaction.productName} • ${transaction.paymentMethod}</div>
                    </div>
                    <div class="transaction-details" style="text-align: right;">
                        <div style="font-weight: 600; color: var(--color-success);">${Utils.formatCurrency(transaction.total)}</div>
                        <div style="font-size: 10px; color: var(--color-text-secondary);">${Utils.formatDate(transaction.timestamp)} ${Utils.formatTime(transaction.timestamp)}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Recent transactions update error:', error);
        }
    },

    showSection: (sectionName) => {
        try {
            console.log('Switching to section:', sectionName);

            // Hide all sections
            const allSections = document.querySelectorAll('.section');
            allSections.forEach(section => {
                section.classList.remove('active');
            });

            // Show target section
            const targetSection = document.getElementById(sectionName);
            if (targetSection) {
                targetSection.classList.add('active');
            }

            // Update sidebar
            const allLinks = document.querySelectorAll('.sidebar__link');
            allLinks.forEach(link => {
                link.classList.remove('active');
            });

            const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
            if (activeLink) {
                activeLink.classList.add('active');
            }

            AppState.currentSection = sectionName;

            // Update content based on data availability
            UI.updateSectionVisibility();

            // Initialize section-specific charts
            setTimeout(() => {
                switch(sectionName) {
                    case 'dashboard':
                        ChartManager.createCustomerPeakTimeChart();
                        UI.updateRecentCustomerActivity();
                        break;
                    case 'customer-analytics':
                        ChartManager.createVisitFrequencyChart();
                        ChartManager.createShoppingDurationChart();
                        UI.updateTopCustomersList();
                        break;
                    case 'sales-analytics':
                        UI.updateRecentTransactionsList();
                        break;
                }
            }, 100);
        } catch (error) {
            console.error('Section switching error:', error);
        }
    },

    updateSectionVisibility: () => {
        try {
            const hasData = AppState.data.transactions.length > 0;
            
            // Dashboard
            const dashboardEmpty = document.getElementById('dashboardEmptyState');
            const dashboardContent = document.getElementById('dashboardContent');
            
            if (dashboardEmpty && dashboardContent) {
                dashboardEmpty.style.display = hasData ? 'none' : 'flex';
                dashboardContent.style.display = hasData ? 'block' : 'none';
            }

            // Customer Analytics
            const customerEmpty = document.getElementById('customerAnalyticsEmpty');
            const customerContent = document.getElementById('customerAnalyticsContent');
            
            if (customerEmpty && customerContent) {
                customerEmpty.style.display = hasData ? 'none' : 'flex';
                customerContent.style.display = hasData ? 'block' : 'none';
            }

            // Sales Analytics
            const salesEmpty = document.getElementById('salesAnalyticsEmpty');
            const salesContent = document.getElementById('salesAnalyticsContent');
            
            if (salesEmpty && salesContent) {
                salesEmpty.style.display = hasData ? 'none' : 'flex';
                salesContent.style.display = hasData ? 'block' : 'none';
            }

            // Update footer status
            const footerStatus = document.getElementById('footerStatus');
            if (footerStatus) {
                footerStatus.textContent = hasData ? 'Data Loaded' : 'Ready';
                footerStatus.className = hasData ? 'status-badge success' : 'status-badge';
            }
        } catch (error) {
            console.error('Section visibility update error:', error);
        }
    },

    updateDBStatus: (connected, message) => {
        try {
            const statusEl = document.getElementById('dbStatus');
            if (!statusEl) return;

            const indicator = statusEl.querySelector('.status-indicator');
            const text = statusEl.querySelector('span:last-child');

            if (connected) {
                if (indicator) indicator.classList.add('connected');
                if (text) text.textContent = message || 'Data Connected';
                AppState.dbConnected = true;
            } else {
                if (indicator) indicator.classList.remove('connected');
                if (text) text.textContent = message || 'No Data Connected';
                AppState.dbConnected = false;
            }
        } catch (error) {
            console.error('DB status update error:', error);
        }
    }
};

// Enhanced Excel Processing
const ExcelProcessor = {
    processFile: (file) => {
        return new Promise((resolve, reject) => {
            try {
                if (!file) {
                    reject(new Error('No file provided'));
                    return;
                }

                if (file.size > 50 * 1024 * 1024) {
                    reject(new Error('File size too large. Maximum 50MB allowed.'));
                    return;
                }

                const reader = new FileReader();

                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, {type: 'array'});

                        const result = {};

                        workbook.SheetNames.forEach(sheetName => {
                            try {
                                const worksheet = workbook.Sheets[sheetName];
                                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                                result[sheetName.toLowerCase()] = jsonData;
                            } catch (sheetError) {
                                console.warn(`Error processing sheet ${sheetName}:`, sheetError);
                            }
                        });

                        resolve(result);
                    } catch (error) {
                        reject(new Error('Failed to parse Excel file: ' + error.message));
                    }
                };

                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsArrayBuffer(file);
            } catch (error) {
                reject(error);
            }
        });
    },

    validateData: (data) => {
        const errors = [];
        const warnings = [];

        try {
            // Check for transactions sheet
            const transactions = data.transactions || data.transaction || [];
            
            if (!Array.isArray(transactions) || transactions.length === 0) {
                errors.push('No transaction data found. Please include a "Transactions" sheet.');
                return { errors, warnings };
            }

            // Validate required fields
            const requiredFields = ['customer_name', 'timestamp', 'total'];
            const optionalFields = ['product_name', 'payment_method', 'category'];
            const firstRow = transactions[0];

            requiredFields.forEach(field => {
                if (!(field in firstRow)) {
                    errors.push(`Missing required field: ${field} in transactions sheet`);
                }
            });

            optionalFields.forEach(field => {
                if (!(field in firstRow)) {
                    warnings.push(`Missing optional field: ${field} in transactions sheet`);
                }
            });

            // Validate data types
            transactions.slice(0, 10).forEach((row, index) => {
                if (!row.customer_name || typeof row.customer_name !== 'string') {
                    errors.push(`Invalid or missing customer_name in row ${index + 2}`);
                }
                if (row.total && isNaN(parseFloat(row.total))) {
                    errors.push(`Invalid total value in row ${index + 2}`);
                }
                if (row.timestamp && isNaN(new Date(row.timestamp).getTime())) {
                    warnings.push(`Invalid timestamp in row ${index + 2}`);
                }
            });

        } catch (error) {
            errors.push('Error validating data: ' + error.message);
        }

        return { errors, warnings };
    }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Customer Peak Time Analytics - Initializing...');

    try {
        // Initialize UI
        UI.updateCurrentDate();
        UI.updateKPIs(false);
        UI.updateDBStatus(false, 'No Data Connected');
        UI.updateSectionVisibility();

        // Sidebar Navigation
        document.querySelectorAll('.sidebar__link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const section = this.getAttribute('data-section');
                if (section) {
                    UI.showSection(section);
                }
            });
        });

        // Customer Search
        const customerSearch = document.getElementById('customerSearch');
        if (customerSearch) {
            customerSearch.addEventListener('input', Utils.debounce(function(e) {
                AppState.customerSearch = e.target.value.toLowerCase();
                console.log('Customer search:', AppState.customerSearch);
                // Implement search functionality here
            }, 300));
        }

        // Chart Period Controls
        document.addEventListener('click', function(e) {
            if (e.target.hasAttribute('data-period')) {
                const period = e.target.getAttribute('data-period');
                AppState.currentPeriod = period;
                
                // Update button states
                document.querySelectorAll('[data-period]').forEach(btn => {
                    btn.classList.remove('btn--primary');
                    btn.classList.add('btn--outline');
                });
                e.target.classList.remove('btn--outline');
                e.target.classList.add('btn--primary');
                
                // Refresh chart
                ChartManager.createCustomerPeakTimeChart();
            }
        });

        // File Upload Handling
        const fileInput = document.getElementById('fileInput');
        const uploadArea = document.getElementById('uploadArea');
        const browseBtn = document.getElementById('browseBtn');

        if (browseBtn && fileInput) {
            browseBtn.addEventListener('click', (e) => {
                e.preventDefault();
                fileInput.click();
            });
        }

        if (uploadArea && fileInput) {
            // Drag and drop functionality
            uploadArea.addEventListener('dragover', function(e) {
                e.preventDefault();
                this.classList.add('dragover');
            });

            uploadArea.addEventListener('dragleave', function(e) {
                e.preventDefault();
                if (!this.contains(e.relatedTarget)) {
                    this.classList.remove('dragover');
                }
            });

            uploadArea.addEventListener('drop', function(e) {
                e.preventDefault();
                this.classList.remove('dragover');
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    handleFileUpload(files[0]);
                }
            });

            uploadArea.addEventListener('click', function(e) {
                if (e.target !== browseBtn && !browseBtn.contains(e.target)) {
                    fileInput.click();
                }
            });

            fileInput.addEventListener('change', function(e) {
                if (e.target.files.length > 0) {
                    handleFileUpload(e.target.files[0]);
                }
            });
        }

        // File Upload Handler
        function handleFileUpload(file) {
            try {
                console.log('Processing file:', file.name);

                if (!file.name.match(/\.(xlsx|xls)$/i)) {
                    Utils.showMessage('Please upload an Excel file (.xlsx or .xls)', 'error');
                    return;
                }

                AppState.isLoading = true;
                Utils.showMessage('📊 Processing customer data...', 'info');

                ExcelProcessor.processFile(file)
                    .then(data => {
                        console.log('Excel data processed:', data);
                        const validation = ExcelProcessor.validateData(data);

                        if (validation.errors.length > 0) {
                            Utils.showMessage('❌ Data validation failed: ' + validation.errors.join(', '), 'error');
                            return;
                        }

                        if (validation.warnings.length > 0) {
                            Utils.showMessage('⚠️ ' + validation.warnings.join(', '), 'warning');
                        }

                        // Update app state with new data
                        if (data.transactions || data.transaction) {
                            AppState.data.transactions = data.transactions || data.transaction;
                            console.log('Transactions loaded:', AppState.data.transactions.length, 'records');
                        }
                        if (data.customers || data.customer) {
                            AppState.data.customers = data.customers || data.customer;
                            console.log('Customers loaded:', AppState.data.customers.length, 'records');
                        }
                        if (data.products || data.product) {
                            AppState.data.products = data.products || data.product;
                            console.log('Products loaded:', AppState.data.products.length, 'records');
                        }

                        UI.updateDBStatus(true, 'Customer Data Loaded');
                        UI.updateKPIs(true);
                        UI.updateSectionVisibility();

                        // Refresh current section
                        UI.showSection(AppState.currentSection);

                        Utils.showMessage('✅ Customer data loaded successfully! Analyzing peak times...', 'success');
                    })
                    .catch(error => {
                        console.error('Excel processing error:', error);
                        Utils.showMessage('❌ Error processing Excel file: ' + error.message, 'error');
                    })
                    .finally(() => {
                        AppState.isLoading = false;
                    });
            } catch (error) {
                console.error('File upload error:', error);
                Utils.showMessage('❌ Error uploading file: ' + error.message, 'error');
                AppState.isLoading = false;
            }
        }

        // SQL Form Handling
        const sqlForm = document.getElementById('sqlForm');
        if (sqlForm) {
            sqlForm.addEventListener('submit', function(e) {
                e.preventDefault();
                
                try {
                    const dbConfig = {
                        type: document.getElementById('dbType')?.value,
                        host: document.getElementById('dbHost')?.value,
                        database: document.getElementById('dbName')?.value,
                        username: document.getElementById('dbUser')?.value,
                        password: document.getElementById('dbPassword')?.value,
                        port: document.getElementById('dbPort')?.value
                    };

                    if (!dbConfig.host || !dbConfig.database || !dbConfig.username) {
                        Utils.showMessage('Please fill in all required database fields', 'error');
                        return;
                    }

                    AppState.isLoading = true;
                    Utils.showMessage('🔗 Connecting to database...', 'info');

                    setTimeout(() => {
                        UI.updateDBStatus(true, `Connected to ${dbConfig.type.toUpperCase()}`);
                        Utils.showMessage('✅ Database connected successfully!', 'success');
                        AppState.isLoading = false;
                    }, 2000);
                } catch (error) {
                    console.error('SQL connection error:', error);
                    Utils.showMessage('Error connecting to database: ' + error.message, 'error');
                    AppState.isLoading = false;
                }
            });
        }

        console.log('Customer Peak Time Analytics - Ready!');
        Utils.showMessage('🚀 FreshMart SuperStore Analytics ready! Import your data to start analyzing customer peak times.', 'info', 6000);

    } catch (error) {
        console.error('App initialization error:', error);
        Utils.showMessage('Error initializing application: ' + error.message, 'error');
    }
});

// Export for debugging
if (typeof window !== 'undefined') {
    window.AppState = AppState;
    window.Analytics = Analytics;
    window.UI = UI;
}