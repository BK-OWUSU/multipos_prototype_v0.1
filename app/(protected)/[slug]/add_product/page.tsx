"use client"
import { useEffect } from 'react'
import AddProductPageForm from './AddProductPageForm'
import { useCategoryStore } from '@/store/categoryStore';
import { useBrandStore } from "@/store/brandStore";

export default function AddProductPage() {
  const {fetchCategories, categories} = useCategoryStore();
  const {fetchBrands, brands} = useBrandStore();
  useEffect(()=>{
    fetchCategories();
    fetchBrands();
  },[fetchBrands, fetchCategories])
  return (
    <div>
        <AddProductPageForm
          categories={categories || []}
          brands={brands || []}

        />
    </div>
  )
}

