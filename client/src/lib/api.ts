const getAuthToken = () => {
  return localStorage.getItem("adminToken");
};

export const apiRequest = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/admin-login";
  }

  return response;
};

// Special API request for file uploads (without Content-Type header)
export const apiFormDataRequest = async (url: string, formData: FormData) => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (response.status === 401) {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    window.location.href = "/admin-login";
    throw new Error("Unauthorized");
  }

  return response;
};

export const fetchStats = async () => {
  const response = await apiRequest("/api/admin/stats");
  if (!response.ok) throw new Error("Failed to fetch stats");
  return response.json();
};

export const fetchProducts = async () => {
  const response = await apiRequest("/api/products");
  if (!response.ok) throw new Error("Failed to fetch products");
  const products = await response.json();
  
  // Debug: log image URLs
  console.log("Fetched products with images:", products.map((p: any) => ({
    name: p.name,
    image: p.image,
    hasImage: !!p.image
  })));
  
  return products;
};

export const createProduct = async (product: any) => {
  const response = await apiRequest("/api/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error("Failed to create product");
  return response.json();
};

export const updateProduct = async (id: string, product: any) => {
  const response = await apiRequest(`/api/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error("Failed to update product");
  return response.json();
};

export const deleteProduct = async (id: string) => {
  const response = await apiRequest(`/api/admin/products/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete product");
  return response.json();
};

export const fetchCategories = async () => {
  const response = await apiRequest("/api/categories");
  if (!response.ok) throw new Error("Failed to fetch categories");
  return response.json();
};

export const createCategory = async (category: any) => {
  const response = await apiRequest("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(category),
  });
  if (!response.ok) throw new Error("Failed to create category");
  return response.json();
};

export const updateCategory = async (id: string, category: any) => {
  const response = await apiRequest(`/api/admin/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(category),
  });
  if (!response.ok) throw new Error("Failed to update category");
  return response.json();
};

export const deleteCategory = async (id: string) => {
  const response = await apiRequest(`/api/admin/categories/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete category");
  return response.json();
};

export const fetchOrders = async () => {
  const response = await apiRequest("/api/admin/orders");
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
};

export const updateOrder = async (id: string, order: any) => {
  const response = await apiRequest(`/api/admin/orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(order),
  });
  if (!response.ok) throw new Error("Failed to update order");
  return response.json();
};

export const fetchUsers = async () => {
  const response = await apiRequest("/api/admin/users");
  if (!response.ok) throw new Error("Failed to fetch users");
  return response.json();
};

export const fetchUserDetails = async (id: string) => {
  const response = await apiRequest(`/api/admin/users/${id}`);
  if (!response.ok) throw new Error("Failed to fetch user details");
  return response.json();
};

export const uploadImage = async (file: File) => {
  console.log("Starting image upload for file:", file.name, file.size, file.type);
  
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await apiFormDataRequest("/api/admin/upload", formData);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Upload failed with status:", response.status, errorText);
      throw new Error(`Upload failed: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Upload response data:", data);
    
    if (!data.imageUrl) {
      throw new Error("No image URL returned from server");
    }
    
    console.log("Image uploaded successfully. URL:", data.imageUrl);
    return data;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};