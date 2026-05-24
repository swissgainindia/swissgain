import React, { useState } from 'react';

// Type definitions
interface User {
  id: number;
  name: string;
  email: string;
  joinDate: string;
  status: 'active' | 'inactive';
  totalSales: number;
  commission: number;
  referrals: number;
}

interface Product {
  id: number;
  name: string;
  price: number;
  sales: number;
  commissionRate: number;
}

interface CommissionTier {
  minSales: number;
  maxSales: number;
  commissionRate: number;
}

const admindashboard: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data - in a real app, this would come from an API
  const [users, setUsers] = useState<User[]>([
    { id: 1, name: 'John Doe', email: 'john@example.com', joinDate: '2023-01-15', status: 'active', totalSales: 12500, commission: 1250, referrals: 12 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', joinDate: '2023-02-20', status: 'active', totalSales: 8500, commission: 850, referrals: 8 },
    { id: 3, name: 'Robert Johnson', email: 'robert@example.com', joinDate: '2023-03-05', status: 'inactive', totalSales: 4500, commission: 450, referrals: 5 },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', joinDate: '2023-04-10', status: 'active', totalSales: 21000, commission: 2100, referrals: 21 },
    { id: 5, name: 'Michael Wilson', email: 'michael@example.com', joinDate: '2023-05-15', status: 'active', totalSales: 9800, commission: 980, referrals: 9 },
  ]);

  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Premium Smartwatch', price: 299, sales: 150, commissionRate: 10 },
    { id: 2, name: 'Wireless Earbuds', price: 129, sales: 230, commissionRate: 8 },
    { id: 3, name: 'Fitness Tracker', price: 89, sales: 180, commissionRate: 12 },
    { id: 4, name: 'Bluetooth Speaker', price: 79, sales: 95, commissionRate: 7 },
    { id: 5, name: 'Phone Case', price: 39, sales: 310, commissionRate: 5 },
  ]);

  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([
    { minSales: 0, maxSales: 5000, commissionRate: 5 },
    { minSales: 5001, maxSales: 15000, commissionRate: 8 },
    { minSales: 15001, maxSales: 30000, commissionRate: 10 },
    { minSales: 30001, maxSales: 50000, commissionRate: 12 },
    { minSales: 50001, maxSales: Infinity, commissionRate: 15 },
  ]);

  // Calculate totals for dashboard
  const totalSales = users.reduce((sum, user) => sum + user.totalSales, 0);
  const totalCommission = users.reduce((sum, user) => sum + user.commission, 0);
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const totalProducts = products.length;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="bg-gray-900 text-purple-100 w-64 px-4 py-6 flex flex-col">
        <h2 className="text-2xl font-bold text-center mb-8 text-purple-400">Affiliate Admin</h2>

        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'overview' ? 'bg-purple-800 text-white' : 'hover:bg-gray-800'}`}
                onClick={() => setActiveTab('overview')}
              >
                Dashboard Overview
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-purple-800 text-white' : 'hover:bg-gray-800'}`}
                onClick={() => setActiveTab('users')}
              >
                Affiliate Users
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-purple-800 text-white' : 'hover:bg-gray-800'}`}
                onClick={() => setActiveTab('products')}
              >
                Products & Sales
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'commissions' ? 'bg-purple-800 text-white' : 'hover:bg-gray-800'}`}
                onClick={() => setActiveTab('commissions')}
              >
                Commission Settings
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'referrals' ? 'bg-purple-800 text-white' : 'hover:bg-gray-800'}`}
                onClick={() => setActiveTab('referrals')}
              >
                Refer & Earn
              </button>
            </li>
            <li>
              <button
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === 'reports' ? 'bg-purple-800 text-white' : 'hover:bg-gray-800'}`}
                onClick={() => setActiveTab('reports')}
              >
                Reports & Analytics
              </button>
            </li>
          </ul>
        </nav>

        <div className="pt-6 mt-6 border-t border-gray-800">
          <div className="flex items-center px-4">
            <div className="flex-shrink-0">
              <svg className="h-10 w-10 rounded-full bg-purple-700 p-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs font-medium text-gray-400">admin@example.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Affiliate Program Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-full bg-gray-100 hover:bg-gray-200">
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
              <button className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900">
                <span>Settings</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {/* Overview Dashboard */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900">Total Sales</h2>
                      <p className="text-2xl font-bold">${totalSales.toLocaleString()}</p>
                      <p className="text-sm text-green-600 flex items-center mt-1">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        +12.5% from last month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900">Active Users</h2>
                      <p className="text-2xl font-bold">{activeUsers} / {totalUsers}</p>
                      <p className="text-sm text-green-600 flex items-center mt-1">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        +8.2% from last month
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900">Total Products</h2>
                      <p className="text-2xl font-bold">{totalProducts}</p>
                      <p className="text-sm text-gray-600 mt-1">+2 new this month</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8l3 5m0 0l3-5m-3 5v4m-3-5h6m-6 3h6m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h2 className="text-lg font-semibold text-gray-900">Total Commission</h2>
                      <p className="text-2xl font-bold">${totalCommission.toLocaleString()}</p>
                      <p className="text-sm text-green-600 flex items-center mt-1">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        +15.3% from last month
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Sales Performance Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Performance</h2>
                  <div className="h-80">
                    <div className="flex items-end h-64 space-x-2 mb-4">
                      {/* Sample bar chart */}
                      {[65, 45, 80, 60, 75, 55, 90, 70, 85, 65, 75, 95].map((height, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-b from-purple-400 to-purple-600 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-xs text-gray-500 mt-1">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900">Monthly Revenue</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        +12.5% from last month
                      </p>
                    </div>
                  </div>
                </div>

                {/* User Acquisition Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">User Acquisition</h2>
                  <div className="h-80">
                    <div className="flex items-end h-64 space-x-2 mb-4">
                      {/* Sample bar chart for user acquisition */}
                      {[40, 50, 60, 70, 65, 75, 85, 80, 90, 95, 85, 100].map((height, index) => (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div
                            className="w-full bg-gradient-to-b from-blue-400 to-blue-600 rounded-t"
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="text-xs text-gray-500 mt-1">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][index]}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900">New Affiliates</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        +8.2% from last month
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Traffic Sources */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Traffic Sources</h2>
                  <div className="h-80">
                    <div className="grid grid-cols-2 gap-4 h-64">
                      {/* Doughnut chart placeholder */}
                      <div className="relative flex items-center justify-center">
                        <div className="absolute w-32 h-32 rounded-full border-8 border-purple-500"></div>
                        <div className="absolute w-28 h-28 rounded-full border-8 border-blue-500 rotate-90"></div>
                        <div className="absolute w-24 h-24 rounded-full border-8 border-green-500 rotate-180"></div>
                        <div className="absolute w-20 h-20 rounded-full border-8 border-yellow-500 rotate-270"></div>
                        <div className="text-center">
                          <p className="text-xl font-bold">100%</p>
                          <p className="text-xs text-gray-500">Total Traffic</p>
                        </div>
                      </div>
                      <div className="flex flex-col justify-center space-y-4">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                          <span className="text-sm">Direct: 45%</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                          <span className="text-sm">Social: 25%</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                          <span className="text-sm">Email: 15%</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                          <span className="text-sm">Referral: 15%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Conversion Rate */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Conversion Rate</h2>
                  <div className="h-80">
                    <div className="flex items-end h-64 space-x-2 mb-4">
                      {/* Sample line chart */}
                      <div className="relative h-full flex-1">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          {[0, 1, 2, 3, 4].map(i => (
                            <div key={i} className="border-t border-gray-200"></div>
                          ))}
                        </div>

                        {/* Line */}
                        <div className="absolute inset-0">
                          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path
                              d="M0,80 C20,60 40,40 50,30 C60,20 80,10 100,0"
                              stroke="#8B5CF6"
                              strokeWidth="2"
                              fill="none"
                            />
                            <path
                              d="M0,80 C20,60 40,40 50,30 C60,20 80,10 100,0"
                              stroke="url(#gradient)"
                              strokeWidth="3"
                              fill="none"
                            />
                            <defs>
                              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="100%" stopColor="#EC4899" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900">Overall Conversion Rate</p>
                      <p className="text-sm text-green-600 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        +5.7% from last month
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Affiliates</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversion</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {users.slice().sort((a, b) => b.totalSales - a.totalSales).slice(0, 5).map((user) => (
                          <tr key={user.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${user.totalSales.toLocaleString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${user.commission.toLocaleString()}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{user.referrals}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {Math.floor(Math.random() * 20) + 15}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                          <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.slice().sort((a, b) => b.sales - a.sales).slice(0, 5).map((product) => (
                          <tr key={product.id}>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${product.price}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{product.sales}</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{product.commissionRate}%</td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">${(product.price * product.sales).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Affiliate Users */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Affiliate Users</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrals</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.joinDate}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.totalSales.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.commission.toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.referrals}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products & Sales */}
          {activeTab === 'products' && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Products & Sales</h2>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Add New Product</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission Rate</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                      <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sales}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.commissionRate}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(product.price * product.sales).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Commission Settings */}
          {activeTab === 'commissions' && (
            <div>
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Commission Tiers</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Minimum Sales</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maximum Sales</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission Rate</th>
                        <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {commissionTiers.map((tier, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${tier.minSales.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {tier.maxSales === Infinity ? 'No limit' : `$${tier.maxSales.toLocaleString()}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tier.commissionRate}%</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                            <button className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Commission Tier</h2>
                <form className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Sales</label>
                    <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Sales</label>
                    <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="5000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                    <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="5" />
                  </div>
                  <div className="md:col-span-3">
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Add Tier</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Refer & Earn */}
          {activeTab === 'referrals' && (
            <div>
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Referral Program Settings</h2>
                </div>
                <div className="p-6">
                  <form>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Referral Bonus (for referrer)</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" defaultValue="10" />
                        <p className="mt-1 text-sm text-gray-500">Amount the referrer earns when someone signs up using their link</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Signup Bonus (for referred)</label>
                        <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md" defaultValue="5" />
                        <p className="mt-1 text-sm text-gray-500">Amount the new user gets when signing up with a referral link</p>
                      </div>
                    </div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Referral Program Terms</label>
                      <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md" rows={4} defaultValue="Sign up with a friend's referral link and both get bonus credits!"></textarea>
                    </div>
                    <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">Save Settings</button>
                  </form>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Referral Links</h2>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Default Referral Link</label>
                    <div className="flex">
                      <input type="text" readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md" value="https://example.com/ref/admin" />
                      <button className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700">Copy</button>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-2">Custom Referral Links</h3>
                    <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 mb-4">Create Custom Link</button>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signups</th>
                            <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">https://example.com/ref/summer2023</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-06-01</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">142</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">23</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                              <button className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">https://example.com/ref/winterpromo</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2023-12-01</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">89</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">15</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                              <button className="text-red-600 hover:text-red-900">Delete</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports & Analytics */}
          {activeTab === 'reports' && (
            <div>
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Generate Reports</h2>
                </div>
                <div className="p-6">
                  <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                      <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                        <option>Sales Report</option>
                        <option>User Activity</option>
                        <option>Commission Report</option>
                        <option>Referral Performance</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input type="date" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="flex items-end">
                      <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 w-full">Generate Report</button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h2>
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-md">
                    <p className="text-gray-500">Sales chart would be displayed here</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">User Signups</h2>
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-md">
                    <p className="text-gray-500">User growth chart would be displayed here</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Affiliates</h2>
                  <div className="h-64 flex items-center justify-center bg-gray-100 rounded-md">
                    <p className="text-gray-500">Performance chart would be displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default admindashboard;