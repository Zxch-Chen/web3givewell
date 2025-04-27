"\"use client"

interface ProjectsFilterProps {
  categories: string[]
  categoryFilter: string
  setCategoryFilter: (category: string) => void
  sortBy: string
  setSortBy: (sort: string) => void
}

export function ProjectsFilter({
  categories,
  categoryFilter,
  setCategoryFilter,
  sortBy,
  setSortBy,
}: ProjectsFilterProps) {
  return (
    <div>
      {/* Category Filters */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Category</label>
        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category} className="flex items-center">
              <input
                type="radio"
                id={`category-${category}`}
                name="category"
                checked={categoryFilter === category}
                onChange={() => setCategoryFilter(category)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor={`category-${category}`} className="ml-2 text-sm text-foreground">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="rating">Auditor Rating</option>
          <option value="successRate">Success Rate</option>
          <option value="fundingWithheld">Least Funding Withheld</option>
          <option value="totalRaised">Total Funds Raised</option>
          <option value="completedProjects">Completed Projects</option>
        </select>
      </div>
    </div>
  )
}
\
"
