import { create } from 'zustand'
import { getCategories } from '@/api/categories.js'

const useCategoryStore = create((set) => ({
  categories: [],
  isLoaded: false,

  fetchCategories: async () => {
    const res = await getCategories()
    set({ categories: res.data, isLoaded: true })
  },

  getCategoriesByType: (type) => {
    // 호출 시점에 state를 직접 가져오는 selector용이 아닌 단순 helper
    // 컴포넌트에서 useCategoryStore(state => state.categories).filter(...) 권장
  },
}))

export default useCategoryStore
