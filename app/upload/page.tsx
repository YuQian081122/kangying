"use client"

import { useState, useEffect } from "react"
import { X, Plus, Upload, Loader2, Building2, Package, Trash2, Edit } from "lucide-react"
import type { Brand, Product } from "@/lib/products"
import { RichTextEditor } from "@/components/RichTextEditor"

type ModalType =
  | "addBrand"
  | "addProduct"
  | "editBrand"
  | "editProduct"
  | "deleteBrand"
  | "deleteProduct"
  | "editContent"
  | null

export default function UploadPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState("")
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedBrand, setSelectedBrand] = useState<string>("")
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [modalType, setModalType] = useState<ModalType>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
    viewHome?: boolean
  } | null>(null)

  // 二次驗證狀態
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmStep, setConfirmStep] = useState<"summary" | "password">("summary")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [confirmPasswordError, setConfirmPasswordError] = useState("")
  const [pendingAction, setPendingAction] = useState<{
    type:
      | "addBrand"
      | "addProduct"
      | "editBrand"
      | "editProduct"
      | "deleteBrand"
      | "deleteProduct"
      | "editContent"
    data?: any
  } | null>(null)

  // 編輯狀態
  const [editingBrandId, setEditingBrandId] = useState<string>("")
  const [editingProductId, setEditingProductId] = useState<string>("")
  const [editProductBrandId, setEditProductBrandId] = useState<string>("")

  // 產品內容編輯狀態
  const [contentBrandId, setContentBrandId] = useState<string>("")
  const [contentProductId, setContentProductId] = useState<string>("")
  const [contentHtml, setContentHtml] = useState<string>("")

  // 表單狀態
  const [brandName, setBrandName] = useState("")
  const [brandDescription, setBrandDescription] = useState("")
  const [brandLogo, setBrandLogo] = useState<File | null>(null)
  const [brandLogoPreview, setBrandLogoPreview] = useState<string>("")

  const [productName, setProductName] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productFeatures, setProductFeatures] = useState<string[]>([""])
  const [productImages, setProductImages] = useState<File[]>([])
  const [productImagePreviews, setProductImagePreviews] = useState<string[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadBrands()
      loadProducts()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (modalType === "editProduct") {
      loadBrands()
      if (editProductBrandId) {
        loadProducts(editProductBrandId)
      } else {
        loadProducts()
      }
    }
    if (modalType === "deleteProduct") {
      loadBrands()
      if (selectedBrand) {
        loadProducts(selectedBrand)
      } else {
        loadProducts()
      }
    }
  }, [editProductBrandId, selectedBrand, modalType])

  // 當選擇要編輯的公司時，自動填充表單
  useEffect(() => {
    if (editingBrandId && modalType === "editBrand") {
      const brand = brands.find((b) => b.id === editingBrandId)
      if (brand) {
        setBrandName(brand.name)
        setBrandDescription(brand.description)
        setBrandLogoPreview(brand.logoImage || "")
        setBrandLogo(null) // 重置文件選擇
      }
    }
  }, [editingBrandId, modalType, brands])

  // 當選擇要編輯的產品時，自動填充表單
  useEffect(() => {
    if (editingProductId && modalType === "editProduct" && editProductBrandId) {
      const product = products.find((p) => p.id === editingProductId && p.brand === editProductBrandId)
      if (product) {
        setProductName(product.name)
        setProductDescription(product.description)
        setProductFeatures(product.features && product.features.length > 0 ? product.features : [""])
        setProductImages([]) // 新上傳的圖片
        setProductImagePreviews(product.images || []) // 現有圖片預覽
      }
    } else if (editingProductId && modalType === "editProduct" && !editProductBrandId) {
      // 如果品牌被清空，重置表單
      resetProductForm()
      setEditingProductId("")
    }
  }, [editingProductId, modalType, editProductBrandId, products])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/upload/auth", { credentials: "include" })
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
    } catch (error) {
      setIsAuthenticated(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginError("")

    try {
      const res = await fetch("/api/upload/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        setIsAuthenticated(true)
      } else {
        setLoginError(data.error || "登入失敗")
      }
    } catch (error) {
      setLoginError("登入時發生錯誤")
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/upload/auth", { method: "DELETE", credentials: "include" })
    setIsAuthenticated(false)
    setPassword("")
  }

  const loadBrands = async () => {
    try {
      const res = await fetch(`/api/upload/brands?_t=${Date.now()}`, {
        cache: "no-store",
        credentials: "include",
      })
      const data = await res.json()
      if (data.brands) {
        setBrands(data.brands)
      }
    } catch (error) {
      console.error("Failed to load brands:", error)
    }
  }

  const loadProducts = async (brandId?: string) => {
    try {
      const base = brandId
        ? `/api/upload/products?brandId=${brandId}`
        : "/api/upload/products"
      const url = `${base}${base.includes("?") ? "&" : "?"}_t=${Date.now()}`
      const res = await fetch(url, { cache: "no-store", credentials: "include" })
      const data = await res.json()
      if (data.products) {
        setProducts(data.products)
      }
    } catch (error) {
      console.error("Failed to load products:", error)
    }
  }

  const showMessage = (type: "success" | "error", text: string, viewHome?: boolean) => {
    setMessage({ type, text, viewHome })
    setTimeout(() => setMessage(null), 5000)
  }

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 顯示確認模態框
    setPendingAction({
      type: "addBrand",
      data: {
        name: brandName,
        description: brandDescription,
        hasLogo: !!brandLogo,
      },
    })
    setShowConfirmModal(true)
    setConfirmStep("summary")
  }

  const executeAddBrand = async () => {
    setIsLoading(true)

    try {
      let logoPath = ""

      // 上傳LOGO
      if (brandLogo) {
        const formData = new FormData()
        formData.append("type", "brand")
        formData.append("file", brandLogo)
        formData.append("brandId", brandName.replace(/[^\w\s]/g, "").replace(/\s+/g, "").toUpperCase())

        const uploadRes = await fetch("/api/upload/upload-image", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (uploadRes.ok) {
          logoPath = uploadData.path
        } else {
          showMessage("error", uploadData.error || "LOGO 上傳失敗")
          return
        }
      }

      // 新增公司
      const res = await fetch("/api/upload/brands", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brandName,
          description: brandDescription,
          logoImage: logoPath,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        showMessage("success", "公司新增成功！", true)
        setModalType(null)
        setShowConfirmModal(false)
        resetBrandForm()
        loadBrands()
      } else {
        showMessage("error", data.error || "新增失敗")
      }
    } catch (error) {
      showMessage("error", (error as Error)?.message || "新增時發生錯誤")
    } finally {
      setIsLoading(false)
      setConfirmPassword("")
      setConfirmPasswordError("")
      setPendingAction(null)
    }
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 顯示確認模態框
    const brand = brands.find((b) => b.id === selectedBrand)
    setPendingAction({
      type: "addProduct",
      data: {
        name: productName,
        description: productDescription,
        brand: brand?.name || selectedBrand,
        features: productFeatures.filter((f) => f.trim() !== ""),
        imageCount: productImages.length,
      },
    })
    setShowConfirmModal(true)
    setConfirmStep("summary")
  }

  const executeAddProduct = async () => {
    setIsLoading(true)

    try {
      const imagePaths: string[] = []

      // 上傳產品圖片
      if (productImages.length > 0) {
        for (const file of productImages) {
          const formData = new FormData()
          formData.append("type", "product")
          formData.append("file", file)
          formData.append("brandId", selectedBrand)
          formData.append("productSlug", productName.toLowerCase().replace(/\s+/g, "_"))

          const uploadRes = await fetch("/api/upload/upload-image", {
            method: "POST",
            credentials: "include",
            body: formData,
          })

          const uploadData = await uploadRes.json()
          if (uploadRes.ok) {
            imagePaths.push(uploadData.path)
          } else {
            showMessage("error", uploadData.error || "圖片上傳失敗")
            return
          }
        }
      }

      // 新增產品
      const res = await fetch("/api/upload/products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          description: productDescription,
          features: productFeatures.filter((f) => f.trim() !== ""),
          images: imagePaths,
          brand: selectedBrand,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        showMessage("success", "產品新增成功！", true)
        setModalType(null)
        setShowConfirmModal(false)
        resetProductForm()
        loadProducts()
      } else {
        showMessage("error", data.error || "新增失敗")
      }
    } catch (error) {
      showMessage("error", (error as Error)?.message || "新增時發生錯誤")
    } finally {
      setIsLoading(false)
      setConfirmPassword("")
      setConfirmPasswordError("")
      setPendingAction(null)
    }
  }

  const handleDeleteBrand = () => {
    if (!selectedBrand) {
      showMessage("error", "請選擇要刪除的公司")
      return
    }

    const brand = brands.find((b) => b.id === selectedBrand)
    setPendingAction({
      type: "deleteBrand",
      data: {
        id: selectedBrand,
        name: brand?.name || "",
      },
    })
    setShowConfirmModal(true)
    setConfirmStep("summary")
  }

  const executeDeleteBrand = async () => {
    if (!selectedBrand) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/upload/brands?id=${selectedBrand}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok) {
        showMessage("success", "公司刪除成功！", true)
        setModalType(null)
        setShowConfirmModal(false)
        setSelectedBrand("")
        loadBrands()
        loadProducts()
      } else {
        showMessage("error", data.error || "刪除失敗")
      }
    } catch (error) {
      showMessage("error", (error as Error)?.message || "刪除時發生錯誤")
    } finally {
      setIsLoading(false)
      setConfirmPassword("")
      setConfirmPasswordError("")
      setPendingAction(null)
    }
  }

  const handleDeleteProduct = () => {
    if (!selectedProduct) {
      showMessage("error", "請選擇要刪除的產品")
      return
    }

    const product = products.find((p) => p.id === selectedProduct)
    const brand = brands.find((b) => b.id === selectedBrand)
    setPendingAction({
      type: "deleteProduct",
      data: {
        id: selectedProduct,
        name: product?.name || "",
        brand: brand?.name || "",
      },
    })
    setShowConfirmModal(true)
    setConfirmStep("summary")
  }

  const executeDeleteProduct = async () => {
    if (!selectedProduct) return

    setIsLoading(true)

    try {
      const res = await fetch(`/api/upload/products?id=${selectedProduct}`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok) {
        showMessage("success", "產品刪除成功！", true)
        setModalType(null)
        setShowConfirmModal(false)
        setSelectedProduct("")
        setSelectedBrand("")
        loadProducts()
      } else {
        showMessage("error", data.error || "刪除失敗")
      }
    } catch (error) {
      showMessage("error", (error as Error)?.message || "刪除時發生錯誤")
    } finally {
      setIsLoading(false)
      setConfirmPassword("")
      setConfirmPasswordError("")
      setPendingAction(null)
    }
  }

  const handleEditBrand = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingBrandId) {
      showMessage("error", "請選擇要修改的公司")
      return
    }

    // 顯示確認模態框
    setPendingAction({
      type: "editBrand",
      data: {
        id: editingBrandId,
        name: brandName,
        description: brandDescription,
        hasLogo: !!brandLogo,
      },
    })
    setShowConfirmModal(true)
    setConfirmStep("summary")
  }

  const executeEditBrand = async () => {
    if (!editingBrandId) return

    setIsLoading(true)

    try {
      let logoPath = ""

      // 如果有新LOGO，先上傳
      if (brandLogo) {
        const formData = new FormData()
        formData.append("type", "brand")
        formData.append("file", brandLogo)
        formData.append("brandId", editingBrandId)

        const uploadRes = await fetch("/api/upload/upload-image", {
          method: "POST",
          credentials: "include",
          body: formData,
        })

        const uploadData = await uploadRes.json()
        if (uploadRes.ok) {
          logoPath = uploadData.path
        } else {
          showMessage("error", uploadData.error || "LOGO 上傳失敗")
          return
        }
      }

      // 更新公司
      const res = await fetch(`/api/upload/brands?id=${editingBrandId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: brandName,
          description: brandDescription,
          logoImage: logoPath || brandLogoPreview,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        showMessage("success", "公司修改成功！", true)
        setModalType(null)
        setShowConfirmModal(false)
        resetBrandForm()
        setEditingBrandId("")
        loadBrands()
      } else {
        showMessage("error", data.error || "修改失敗")
      }
    } catch (error) {
      showMessage("error", (error as Error)?.message || "修改時發生錯誤")
    } finally {
      setIsLoading(false)
      setConfirmPassword("")
      setConfirmPasswordError("")
      setPendingAction(null)
    }
  }

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editProductBrandId) {
      showMessage("error", "請選擇要修改的公司")
      return
    }
    if (!editingProductId) {
      showMessage("error", "請選擇要修改的產品")
      return
    }

    const brand = brands.find((b) => b.id === editProductBrandId)
    
    // 顯示確認模態框
    setPendingAction({
      type: "editProduct",
      data: {
        id: editingProductId,
        name: productName,
        description: productDescription,
        brand: brand?.name || editProductBrandId,
        features: productFeatures.filter((f) => f.trim() !== ""),
        imageCount: productImages.length,
      },
    })
    setShowConfirmModal(true)
    setConfirmStep("summary")
  }

  const executeEditProduct = async () => {
    if (!editingProductId) return

    setIsLoading(true)

    try {
      const existingProduct = products.find((p) => p.id === editingProductId)
      let imagePaths: string[] = existingProduct?.images || []

      // 如果有新圖片，先上傳
      if (productImages.length > 0) {
        for (const file of productImages) {
          const formData = new FormData()
          formData.append("type", "product")
          formData.append("file", file)
          formData.append("brandId", editProductBrandId)
          formData.append("productSlug", productName.toLowerCase().replace(/\s+/g, "_"))

          const uploadRes = await fetch("/api/upload/upload-image", {
            method: "POST",
            credentials: "include",
            body: formData,
          })

          const uploadData = await uploadRes.json()
          if (uploadRes.ok) {
            imagePaths.push(uploadData.path)
          } else {
            showMessage("error", uploadData.error || "圖片上傳失敗")
            return
          }
        }
      }

      // 更新產品
      const res = await fetch(`/api/upload/products?id=${editingProductId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          description: productDescription,
          features: productFeatures.filter((f) => f.trim() !== ""),
          images: imagePaths,
          brand: editProductBrandId,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        showMessage("success", "產品修改成功！", true)
        setModalType(null)
        setShowConfirmModal(false)
        resetProductForm()
        setEditingProductId("")
        setEditProductBrandId("")
        loadProducts()
      } else {
        showMessage("error", data.error || "修改失敗")
      }
    } catch (error) {
      showMessage("error", (error as Error)?.message || "修改時發生錯誤")
    } finally {
      setIsLoading(false)
      setConfirmPassword("")
      setConfirmPasswordError("")
      setPendingAction(null)
    }
  }

  const resetBrandForm = () => {
    setBrandName("")
    setBrandDescription("")
    setBrandLogo(null)
    setBrandLogoPreview("")
  }

  const resetProductForm = () => {
    setProductName("")
    setProductDescription("")
    setProductFeatures([""])
    setProductImages([])
    setProductImagePreviews([])
    setSelectedBrand("")
  }

  const handleBrandLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBrandLogo(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setBrandLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleProductImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setProductImages([...productImages, ...files])
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setProductImagePreviews((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeProductImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index))
    setProductImagePreviews(productImagePreviews.filter((_, i) => i !== index))
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...productFeatures]
    newFeatures[index] = value
    setProductFeatures(newFeatures)
  }

  const addFeature = () => {
    setProductFeatures([...productFeatures, ""])
  }

  const removeFeature = (index: number) => {
    if (productFeatures.length > 1) {
      setProductFeatures(productFeatures.filter((_, i) => i !== index))
    }
  }

  const handleConfirmPassword = async () => {
    setConfirmPasswordError("")

    try {
      const res = await fetch("/api/upload/auth", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: confirmPassword }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // 密碼驗證通過，執行實際操作
        if (pendingAction) {
          switch (pendingAction.type) {
            case "addBrand":
              await executeAddBrand()
              break
            case "addProduct":
              await executeAddProduct()
              break
            case "editBrand":
              await executeEditBrand()
              break
            case "editProduct":
              await executeEditProduct()
              break
            case "deleteBrand":
              await executeDeleteBrand()
              break
            case "deleteProduct":
              await executeDeleteProduct()
              break
            case "editContent":
              await executeEditContent()
              break
          }
        }
      } else {
        setConfirmPasswordError(data.error || "密碼錯誤")
      }
    } catch (error) {
      setConfirmPasswordError("驗證時發生錯誤")
    }
  }

  const getConfirmSummary = () => {
    if (!pendingAction) return null

    switch (pendingAction.type) {
      case "addBrand":
        return (
          <div className="space-y-2">
            <h3 className="font-semibold">新增公司</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">公司名稱：</span>{pendingAction.data.name}</p>
              <p><span className="font-medium">公司介紹：</span>{pendingAction.data.description.substring(0, 100)}{pendingAction.data.description.length > 100 ? "\u2026" : ""}</p>
              <p><span className="font-medium">LOGO：</span>{pendingAction.data.hasLogo ? "已上傳" : "無"}</p>
            </div>
          </div>
        )
      case "addProduct":
        return (
          <div className="space-y-2">
            <h3 className="font-semibold">新增產品</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">公司：</span>{pendingAction.data.brand}</p>
              <p><span className="font-medium">產品名稱：</span>{pendingAction.data.name}</p>
              <p><span className="font-medium">產品介紹：</span>{pendingAction.data.description.substring(0, 100)}{pendingAction.data.description.length > 100 ? "\u2026" : ""}</p>
              <p><span className="font-medium">產品特點：</span>{pendingAction.data.features.length} 項</p>
              <p><span className="font-medium">產品圖片：</span>{pendingAction.data.imageCount} 張</p>
            </div>
          </div>
        )
      case "deleteBrand":
        return (
          <div className="space-y-2">
            <h3 className="font-semibold text-red-600">刪除公司</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">公司名稱：</span>{pendingAction.data.name}</p>
              <p className="text-red-600">⚠️ 此操作無法復原</p>
            </div>
          </div>
        )
      case "deleteProduct":
        return (
          <div className="space-y-2">
            <h3 className="font-semibold text-red-600">刪除產品</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">公司：</span>{pendingAction.data.brand}</p>
              <p><span className="font-medium">產品名稱：</span>{pendingAction.data.name}</p>
              <p className="text-red-600">⚠️ 此操作無法復原</p>
            </div>
          </div>
        )
      case "editBrand":
        return (
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">修改公司</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">公司名稱：</span>{pendingAction.data.name}</p>
              <p><span className="font-medium">公司介紹：</span>{pendingAction.data.description.substring(0, 100)}{pendingAction.data.description.length > 100 ? "\u2026" : ""}</p>
              <p><span className="font-medium">LOGO：</span>{pendingAction.data.hasLogo ? "已更新" : "保持原樣"}</p>
            </div>
          </div>
        )
      case "editProduct":
        return (
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">修改產品</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">公司：</span>{pendingAction.data.brand}</p>
              <p><span className="font-medium">產品名稱：</span>{pendingAction.data.name}</p>
              <p><span className="font-medium">產品介紹：</span>{pendingAction.data.description.substring(0, 100)}{pendingAction.data.description.length > 100 ? "\u2026" : ""}</p>
              <p><span className="font-medium">產品特點：</span>{pendingAction.data.features.length} 項</p>
              <p><span className="font-medium">產品圖片：</span>{pendingAction.data.imageCount > 0 ? `新增 ${pendingAction.data.imageCount} 張` : "保持原樣"}</p>
            </div>
          </div>
        )
      case "editContent":
        return (
          <div className="space-y-2">
            <h3 className="font-semibold text-green-600">更新產品詳細內容</h3>
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium">公司：</span>
                {pendingAction.data.brand}
              </p>
              <p>
                <span className="font-medium">產品名稱：</span>
                {pendingAction.data.name}
              </p>
              <p>
                <span className="font-medium">內容長度：</span>
                約 {pendingAction.data.length} 個字元
              </p>
              <p className="text-muted-foreground">
                這將影響產品頁底部的詳細說明與圖片排版區塊。
              </p>
            </div>
          </div>
        )
    }
  }

  const executeEditContent = async () => {
    if (!contentProductId) return

    setIsLoading(true)

    try {
      const product = products.find((p) => p.id === contentProductId)
      if (!product) {
        showMessage("error", "找不到要更新內容的產品")
        return
      }

      const res = await fetch(`/api/upload/products?id=${contentProductId}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          features: product.features || [],
          images: product.images || [],
          brand: product.brand,
          detailContentHtml: contentHtml,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        showMessage("success", "產品詳細內容更新成功！", true)
        setModalType(null)
        setShowConfirmModal(false)
        setContentBrandId("")
        setContentProductId("")
        setContentHtml("")
        loadProducts()
      } else {
        showMessage("error", data.error || "更新內容失敗")
      }
    } catch (error) {
      showMessage("error", (error as Error)?.message || "更新內容時發生錯誤")
    } finally {
      setIsLoading(false)
      setConfirmPassword("")
      setConfirmPasswordError("")
      setPendingAction(null)
    }
  }

  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (isAuthenticated === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold mb-4">管理員登入</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                密碼
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              />
            </div>
            {loginError && <p className="text-sm text-red-500">{loginError}</p>}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoggingIn ? "登入中\u2026" : "登入"}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">商品管理系統</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            登出
          </button>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg border p-4 ${
              message.type === "success"
                ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <span>{message.text}</span>
              {message.viewHome && (
                <button
                  type="button"
                  onClick={() => {
                    const base = typeof window !== "undefined" ? window.location.origin : ""
                    window.location.assign(`${base}/?r=${Date.now()}`)
                  }}
                  className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  立即查看首頁
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {/* 第一行：公司操作 - 藍綠紅 */}
          <button
            onClick={() => {
              setModalType("addBrand")
              resetBrandForm()
            }}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-6 hover:bg-primary/10 transition-colors"
          >
            <Building2 className="h-8 w-8 text-primary" />
            <span className="font-medium text-primary">新增公司</span>
          </button>

          <button
            onClick={() => {
              setModalType("editBrand")
              setEditingBrandId("")
              resetBrandForm()
            }}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-green-500/30 bg-green-500/5 p-6 hover:bg-green-500/10 transition-colors"
          >
            <Edit className="h-8 w-8 text-green-500" />
            <span className="font-medium text-green-600 dark:text-green-400">修改公司</span>
          </button>

          <button
            onClick={() => {
              setModalType("deleteBrand")
              setSelectedBrand("")
            }}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-red-500/30 bg-red-500/5 p-6 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-8 w-8 text-red-500" />
            <span className="font-medium text-red-600 dark:text-red-400">刪除公司</span>
          </button>

          {/* 第二行：產品操作 - 藍綠紅 */}
          <button
            onClick={() => {
              setModalType("addProduct")
              resetProductForm()
            }}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-primary/30 bg-primary/5 p-6 hover:bg-primary/10 transition-colors"
          >
            <Package className="h-8 w-8 text-primary" />
            <span className="font-medium text-primary">新增產品</span>
          </button>

          <button
            onClick={() => {
              setModalType("editProduct")
              setEditingProductId("")
              setEditProductBrandId("")
              resetProductForm()
            }}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-green-500/30 bg-green-500/5 p-6 hover:bg-green-500/10 transition-colors"
          >
            <Edit className="h-8 w-8 text-green-500" />
            <span className="font-medium text-green-600 dark:text-green-400">修改產品</span>
          </button>

          <button
            onClick={() => {
              setModalType("deleteProduct")
              setSelectedBrand("")
              setSelectedProduct("")
            }}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-red-500/30 bg-red-500/5 p-6 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="h-8 w-8 text-red-500" />
            <span className="font-medium text-red-600 dark:text-red-400">刪除產品</span>
          </button>

        </div>

        {/* GIF 圖片 */}
        <div className="mt-8 flex justify-center">
          <img
            src="https://memeprod.ap-south-1.linodeobjects.com/user-gif-post/1705457726094.gif"
            alt=""
            className="w-full max-w-2xl h-auto rounded-lg"
          />
        </div>

        {/* 確認模態框 */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">確認操作</h2>
                <button
                  onClick={() => {
                    setShowConfirmModal(false)
                    setConfirmStep("summary")
                    setConfirmPassword("")
                    setConfirmPasswordError("")
                    setPendingAction(null)
                  }}
                  className="rounded-md p-1 hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {confirmStep === "summary" && (
                <div className="space-y-4">
                  <div className="rounded-md border bg-muted/50 p-4">
                    {getConfirmSummary()}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmStep("password")}
                      className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      確認
                    </button>
                    <button
                      onClick={() => {
                        setShowConfirmModal(false)
                        setConfirmStep("summary")
                        setConfirmPassword("")
                        setConfirmPasswordError("")
                        setPendingAction(null)
                      }}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {confirmStep === "password" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      請再次輸入密碼以確認操作
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setConfirmPasswordError("")
                      }}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      placeholder="輸入密碼"
                      autoFocus
                    />
                    {confirmPasswordError && (
                      <p className="mt-1 text-sm text-red-500">{confirmPasswordError}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleConfirmPassword}
                      disabled={isLoading || !confirmPassword}
                      className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isLoading ? "處理中\u2026" : "確認並執行"}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmStep("summary")
                        setConfirmPassword("")
                        setConfirmPasswordError("")
                      }}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                    >
                      返回
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 模態框 */}
        {modalType && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="w-full max-w-2xl my-8 rounded-lg border bg-card p-6 shadow-lg flex-shrink-0">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {modalType === "addBrand" && "新增公司"}
                  {modalType === "addProduct" && "新增產品"}
                  {modalType === "editBrand" && "修改公司"}
                  {modalType === "editProduct" && "修改產品"}
                  {modalType === "deleteBrand" && "刪除公司"}
                  {modalType === "deleteProduct" && "刪除產品"}
                </h2>
                <button
                  onClick={() => {
                    setModalType(null)
                    resetBrandForm()
                    resetProductForm()
                    setEditingBrandId("")
                    setEditingProductId("")
                    setEditProductBrandId("")
                    setSelectedBrand("")
                    setSelectedProduct("")
                  }}
                  className="rounded-md p-1 hover:bg-muted"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* 新增公司表單 */}
              {modalType === "addBrand" && (
                <form onSubmit={handleAddBrand} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      公司名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      公司介紹 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={brandDescription}
                      onChange={(e) => setBrandDescription(e.target.value)}
                      rows={5}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">公司LOGO</label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleBrandLogoSelect}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                    {brandLogoPreview && (
                      <img
                        src={brandLogoPreview}
                        alt="LOGO預覽"
                        className="mt-2 h-32 w-32 rounded-md object-cover"
                      />
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isLoading ? "提交中\u2026" : "新增"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalType(null)
                        resetBrandForm()
                      }}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}

              {/* 新增產品表單 */}
              {modalType === "addProduct" && (
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      選擇公司 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">請選擇公司</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      產品名稱 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      產品介紹 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={productDescription}
                      onChange={(e) => setProductDescription(e.target.value)}
                      rows={5}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">產品特點</label>
                    <div className="space-y-2">
                      {productFeatures.map((feature, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            placeholder={`特點 ${index + 1}`}
                            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                          />
                          {productFeatures.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="rounded-md border p-2 hover:bg-muted"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addFeature}
                        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                      >
                        <Plus className="h-4 w-4" />
                        新增特點
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">產品圖片（可多張）</label>
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleProductImagesSelect}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    />
                    {productImagePreviews.length > 0 && (
                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {productImagePreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`預覽 ${index + 1}`}
                              className="h-24 w-full rounded-md object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeProductImage(index)}
                              className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || !selectedBrand}
                      className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isLoading ? "提交中\u2026" : "新增"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalType(null)
                        resetProductForm()
                      }}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}

              {/* 修改公司表單 */}
              {modalType === "editBrand" && (
                <form onSubmit={handleEditBrand} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      選擇要修改的公司 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editingBrandId}
                      onChange={(e) => setEditingBrandId(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      required
                    >
                      <option value="">請選擇公司</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editingBrandId && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          公司名稱 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={brandName}
                          onChange={(e) => setBrandName(e.target.value)}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          公司介紹 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={brandDescription}
                          onChange={(e) => setBrandDescription(e.target.value)}
                          rows={5}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">公司LOGO（可選，留空則保持原樣）</label>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleBrandLogoSelect}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        />
                        {brandLogoPreview && (
                          <img
                            src={brandLogoPreview}
                            alt="LOGO預覽"
                            className="mt-2 h-32 w-32 rounded-md object-cover"
                          />
                        )}
                      </div>
                    </>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isLoading || !editingBrandId}
                      className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                    >
                      {isLoading ? "提交中\u2026" : "修改"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalType(null)
                        resetBrandForm()
                        setEditingBrandId("")
                      }}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}

              {/* 修改產品表單 - 使用專用 state editProductBrandId，結構與刪除產品一致 */}
              {modalType === "editProduct" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">選擇要修改的公司</label>
                    <select
                      value={editProductBrandId}
                      onChange={(e) => {
                        setEditProductBrandId(e.target.value)
                        setEditingProductId("")
                        resetProductForm()
                      }}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">請選擇公司</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {editProductBrandId && (
                    <div>
                      <label className="block text-sm font-medium mb-2">選擇要修改的產品</label>
                      <select
                        value={editingProductId}
                        onChange={(e) => setEditingProductId(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">請選擇產品</option>
                        {products
                          .filter((p) => p.brand === editProductBrandId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  {editingProductId && (
                    <form onSubmit={handleEditProduct} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          產品名稱 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          產品介紹 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={productDescription}
                          onChange={(e) => setProductDescription(e.target.value)}
                          rows={5}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">產品特點</label>
                        <div className="space-y-2">
                          {productFeatures.map((feature, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={feature}
                                onChange={(e) => handleFeatureChange(index, e.target.value)}
                                placeholder={`特點 ${index + 1}`}
                                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                              />
                              {productFeatures.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeFeature(index)}
                                  className="rounded-md border p-2 hover:bg-muted"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={addFeature}
                            className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                          >
                            <Plus className="h-4 w-4" />
                            新增特點
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">產品圖片（可選，新增圖片會追加到現有圖片）</label>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handleProductImagesSelect}
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        />
                        {productImagePreviews.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-2">
                            {productImagePreviews.map((preview, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={preview}
                                  alt={`預覽 ${index + 1}`}
                                  className="h-24 w-full rounded-md object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeProductImage(index)}
                                  className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isLoading || !editingProductId}
                          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isLoading ? "提交中\u2026" : "修改"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalType(null)
                            resetProductForm()
                            setEditingProductId("")
                            setEditProductBrandId("")
                          }}
                          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                        >
                          取消
                        </button>
                      </div>
                    </form>
                  )}
                  {!editingProductId && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setModalType(null)
                          resetProductForm()
                          setEditingProductId("")
                          setEditProductBrandId("")
                        }}
                        className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                      >
                        取消
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 刪除公司 */}
              {modalType === "deleteBrand" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">選擇要刪除的公司</label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => setSelectedBrand(e.target.value)}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">請選擇公司</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteBrand}
                      disabled={isLoading || !selectedBrand}
                      className="flex-1 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {isLoading ? "刪除中\u2026" : "刪除"}
                    </button>
                    <button
                      onClick={() => {
                        setModalType(null)
                        setSelectedBrand("")
                      }}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* 刪除產品 */}
              {modalType === "deleteProduct" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">選擇公司</label>
                    <select
                      value={selectedBrand}
                      onChange={(e) => {
                        setSelectedBrand(e.target.value)
                        setSelectedProduct("")
                      }}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">請選擇公司</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {selectedBrand && (
                    <div>
                      <label className="block text-sm font-medium mb-2">選擇要刪除的產品</label>
                      <select
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">請選擇產品</option>
                        {products
                          .filter((p) => p.brand === selectedBrand)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteProduct}
                      disabled={isLoading || !selectedProduct}
                      className="flex-1 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {isLoading ? "刪除中\u2026" : "刪除"}
                    </button>
                    <button
                      onClick={() => {
                        setModalType(null)
                        setSelectedBrand("")
                        setSelectedProduct("")
                      }}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* 編輯產品詳細內容（富文字區塊） */}
              {modalType === "editContent" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      選擇公司 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={contentBrandId}
                      onChange={(e) => {
                        setContentBrandId(e.target.value)
                        setContentProductId("")
                        setContentHtml("")
                      }}
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">請選擇公司</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {contentBrandId && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        選擇產品 <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={contentProductId}
                        onChange={(e) => {
                          const id = e.target.value
                          setContentProductId(id)
                          const product = products.find((p) => p.id === id)
                          setContentHtml(product?.detailContentHtml || "")
                        }}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      >
                        <option value="">請選擇產品</option>
                        {products
                          .filter((p) => p.brand === contentBrandId)
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}

                  {contentProductId && (
                    <div className="space-y-3">
                      <div className="rounded-md border bg-background p-2">
                        <RichTextEditor
                          value={contentHtml}
                          onChange={setContentHtml}
                          brandId={contentBrandId}
                          productSlug={
                            products.find((p) => p.id === contentProductId)?.slug || ""
                          }
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          disabled={isLoading || !contentHtml.trim()}
                          onClick={() => {
                            const brand = brands.find((b) => b.id === contentBrandId)
                            const product = products.find((p) => p.id === contentProductId)
                            setPendingAction({
                              type: "editContent",
                              data: {
                                brand: brand?.name || contentBrandId,
                                name: product?.name || "",
                                length: contentHtml.replace(/<[^>]+>/g, "").trim().length,
                              },
                            })
                            setShowConfirmModal(true)
                            setConfirmStep("summary")
                          }}
                          className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                        >
                          {isLoading ? "儲存中\u2026" : "儲存內容"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModalType(null)
                            setContentBrandId("")
                            setContentProductId("")
                            setContentHtml("")
                          }}
                          className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {!contentProductId && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setModalType(null)
                          setContentBrandId("")
                          setContentProductId("")
                          setContentHtml("")
                        }}
                        className="rounded-md border px-4 py-2 text-sm hover:bg-muted"
                      >
                        關閉
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
