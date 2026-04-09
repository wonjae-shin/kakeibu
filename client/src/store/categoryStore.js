import { create } from 'zustand'
import { getCategories } from '@/api/categories.js'

const useCategoryStore = create((set) => ({
  categories: [],
  isLoaded: false,

  fetchCategories: async () => {
    const res = await getCategories()
    set({ categories: res.data, isLoaded: true })
  },

}))

export default useCategoryStore
