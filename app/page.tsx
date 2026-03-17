export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Dashboard Introduction */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-jso-secondary rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-jso-dark mb-2">
              Welcome to Your Career Intelligence Dashboard
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              Get personalized 30-day improvement plans by analyzing your CV score and GitHub profile. 
              All recommendations use free tools and resources aligned with JSO values.
            </p>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-jso-dark mb-4 flex items-center">
              <span className="w-8 h-8 bg-jso-primary text-white rounded-full flex items-center justify-center text-sm mr-3">1</span>
              Enter Your Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CV Score (0-100)
                </label>
                <input
                  type="number"
                  placeholder="Enter your CV score"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jso-primary focus:border-transparent"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Your curriculum vitae quality rating</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GitHub Username
                </label>
                <input
                  type="text"
                  placeholder="Enter your GitHub username"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-jso-primary focus:border-transparent"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">We&apos;ll analyze your public repositories</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  className="flex-1 bg-jso-primary text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Analyze My Portfolio
                </button>
                <button
                  className="flex-1 bg-jso-secondary text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                >
                  Try Demo
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          {/* JSO Pillars */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-jso-dark mb-3">JSO Pillars</h3>
            <div className="space-y-2">
              {['Governance', 'Workers', 'Community', 'Environment', 'Customers', 'Sustainability'].map((pillar) => (
                <div key={pillar} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-jso-accent rounded-full"></div>
                  <span className="text-sm text-gray-700">{pillar}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              All recommendations align with these organizational values
            </p>
          </div>

          {/* Features */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-jso-dark mb-3">What You&apos;ll Get</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <svg className="w-5 h-5 text-jso-secondary mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>2-3 mini-projects with free tools</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-jso-secondary mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>CV bullet point rewrites</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-jso-secondary mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Free learning resources</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 text-jso-secondary mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>AI reasoning transparency</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Results Placeholder */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-4 sm:p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Your Improvement Plan Will Appear Here</h3>
          <p className="text-sm text-gray-500">
            Enter your information above and click &quot;Analyze My Portfolio&quot; to get started
          </p>
        </div>
      </div>
    </div>
  );
}
