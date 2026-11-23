import { Search, SlidersHorizontal } from 'lucide-react'

/**
 * Search bar + category pills + sort dropdown for scores.
 */
export default function AdvancedFilter({
  search,
  onSearch,
  categories,
  activeCategory,
  onCategory,
  sortKey,
  sortOrder,
  onSort,
}) {
  return (
    <div className="adv-filter">
      {/* Search */}
      <div className="adv-filter__search">
        <Search size={16} className="adv-filter__icon" />
        <input
          type="search"
          placeholder="Cari judul partitur, komposer, atau arranger…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          className="adv-filter__input"
          aria-label="Cari partitur"
        />
      </div>

      {/* Category pills */}
      <div className="adv-filter__pills">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`pill${activeCategory === cat ? ' pill--active' : ''}`}
            onClick={() => onCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className="adv-filter__sort">
        <SlidersHorizontal size={14} />
        <select
          value={`${sortKey}_${sortOrder}`}
          onChange={(e) => {
            const [key, order] = e.target.value.split('_')
            onSort({ key, order })
          }}
          aria-label="Urutkan partitur"
          className="adv-filter__select"
        >
          <option value="name_asc">Judul A → Z</option>
          <option value="name_desc">Judul Z → A</option>
          <option value="price_asc">Tahun Cipta: Terlama → Terbaru</option>
          <option value="price_desc">Tahun Cipta: Terbaru → Terlama</option>
        </select>
      </div>
    </div>
  )
}
