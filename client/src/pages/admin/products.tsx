import { useEffect, useState } from "react";
import { fetchProducts, deleteProduct, reorderProducts } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus, GripVertical } from "lucide-react";
import ProductForm from "./product-form";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableRowProps {
  product: any;
  handleEdit: (product: any) => void;
  handleDelete: (id: string) => void;
}

function SortableRow({ product, handleEdit, handleDelete }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 9999 : "auto",
  };

  const isInStock = product.inStock && (product.stockQuantity || 0) > 0;

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="w-12">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground focus:outline-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5" />
        </button>
      </TableCell>
      <TableCell>
        <img
          src={product.image}
          alt={product.name}
          className="w-12 h-12 object-cover rounded"
        />
      </TableCell>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>{product.category}</TableCell>
      <TableCell>₹{product.price}</TableCell>
      <TableCell>{isInStock ? "In Stock" : "Out of Stock"}</TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(product)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(product._id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await deleteProduct(id);
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      loadProducts();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    loadProducts();
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = products.findIndex((p) => p._id === active.id);
    const newIndex = products.findIndex((p) => p._id === over.id);

    const updatedProducts = arrayMove(products, oldIndex, newIndex);
    setProducts(updatedProducts);

    const reorderedPayload = updatedProducts.map((p, idx) => ({
      id: p._id,
      sortOrder: idx,
    }));

    try {
      await reorderProducts(reorderedPayload);
      toast({
        title: "Success",
        description: "Product sequence updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to persist new product order. Restoring previous state.",
        variant: "destructive",
      });
      loadProducts();
    }
  };

  if (showForm) {
    return <ProductForm product={editingProduct} onClose={handleFormClose} />;
  }

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Products</h2>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      <div className="border rounded-lg">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <SortableContext
                items={products.map((p) => p._id)}
                strategy={verticalListSortingStrategy}
              >
                {products.map((product) => (
                  <SortableRow
                    key={product._id}
                    product={product}
                    handleEdit={handleEdit}
                    handleDelete={handleDelete}
                  />
                ))}
              </SortableContext>
            </TableBody>
          </Table>
        </DndContext>
      </div>
    </div>
  );
}