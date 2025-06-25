import { Users, UserCheck, Activity, Calendar } from 'lucide-react'

const HomePage = () => {
  const stats = [
    {
      name: 'Total Users',
      value: '2,345',
      icon: Users,
      change: '+12%',
      changeType: 'increase'
    },
    {
      name: 'Active Patients',
      value: '1,234',
      icon: UserCheck,
      change: '+8%',
      changeType: 'increase'
    },
    {
      name: 'Appointments',
      value: '45',
      icon: Calendar,
      change: '+23%',
      changeType: 'increase'
    },
    {
      name: 'System Health',
      value: '99.9%',
      icon: Activity,
      change: '+0.1%',
      changeType: 'increase'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600">Welcome to Florism Care Reproductive Health Platform</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <stat.icon className="h-8 w-8 text-primary-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        {stat.value}
                      </div>
                      <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stat.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Manage Users</h3>
                  <p className="text-sm text-gray-500">Add, edit, or view user accounts</p>
                </div>
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="flex items-center space-x-3">
                <Calendar className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Appointments</h3>
                  <p className="text-sm text-gray-500">Schedule and manage appointments</p>
                </div>
              </div>
            </button>
            <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
              <div className="flex items-center space-x-3">
                <Activity className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">System Status</h3>
                  <p className="text-sm text-gray-500">Monitor system health and performance</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage 