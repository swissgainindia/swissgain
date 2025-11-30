// RoleManagement.tsx
'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Edit, Save, X } from "lucide-react";

// Firebase Realtime Database - Direct inside file
// import { initializeApp } from "firebase/app";
// import { getDatabase, ref, set, push, onValue, update, remove } from "firebase/database";

// const firebaseConfig = {
//   apiKey: "AIzaSyAfjwMO98DIl9XhoAbtWZbLUej1WtCa15k",
//   authDomain: "swissgain-a2589.firebaseapp.com",
//   databaseURL: "https://swissgain-a2589-default-rtdb.firebaseio.com",
//   projectId: "swissgain-a2589",
//   storageBucket: "swissgain-a2589.appspot.com",
//   messagingSenderId: "1062016445247",
//   appId: "1:1062016445247:web:bf559ce1ed7f17e2ca418a"
// };


// Import from shared file
import { database } from "./../../lib/firebase";
import { ref, set, push, onValue, update, remove } from "firebase/database";

// const app = initializeApp(firebaseConfig);
// const database = getDatabase(app);

interface Role {
  id: string;
  username: string;
  password: string;
  permissions: Record<string, boolean>;
  createdAt: string;
}

const menuPermissions = [
  { id: "dashboard", label: "Dashboard" },
  { id: "products", label: "Products" },
  { id: "categories", label: "Categories" },
  { id: "orders", label: "Orders" },
  { id: "users", label: "Affiliate Users" },
  { id: "referusers", label: "Refer User" },
  { id: "paymentrequest", label: "Payment Request" },
  { id: "adminsupportcenter", label: "Support Center" },
  { id: "role", label: "Role Management" },
];

export default function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    permissions: {
      dashboard: false,
      products: false,
      categories: false,
      orders: false,
      users: false,
      referusers: false,
      paymentrequest: false,
      adminsupportcenter: false,
      role: false,
    }
  });

  useEffect(() => {
    const rolesRef = ref(database, "adminRoles");
    const unsubscribe = onValue(rolesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedRoles = Object.entries(data).map(([id, value]: any) => ({
          id,
          ...value
        })) as Role[];
        setRoles(loadedRoles);
      } else {
        setRoles([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const resetForm = () => {
    setFormData({
      username: "",
      password: "",
      permissions: {
        dashboard: false, products: false, categories: false, orders: false,
        users: false, referusers: false, paymentrequest: false,
        adminsupportcenter: false, role: false,
      }
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      alert("Username and password are required");
      return;
    }

    const roleData = {
      username: formData.username.trim(),
      password: formData.password,
      permissions: formData.permissions,
      createdAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await update(ref(database, `adminRoles/${editingId}`), roleData);
      } else {
        const newRef = push(ref(database, "adminRoles"));
        await set(newRef, roleData);
      }
      resetForm();
      alert(editingId ? "Role updated!" : "Role created successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save role");
    }
  };

  const handleEdit = (role: Role) => {
    setFormData({
      username: role.username,
      password: role.password,
      permissions: role.permissions,
    });
    setEditingId(role.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this admin account permanently?")) return;
    try {
      await remove(ref(database, `adminRoles/${id}`));
      alert("Deleted successfully");
    } catch (err) {
      alert("Failed to delete");
    }
  };

  const toggleAll = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: Object.fromEntries(Object.keys(prev.permissions).map(k => [k, checked])) as any
    }));
  };

  const allSelected = Object.values(formData.permissions).every(Boolean);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-purple-800">Role Management</h1>
        <Button onClick={() => setIsAdding(true)} disabled={isAdding} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-5 w-5 mr-2" /> Add New Admin
        </Button>
      </div>

      {(isAdding || editingId) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{editingId ? "Edit Admin" : "Create New Admin"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <Label>Username</Label>
                  <Input value={formData.username} onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))} required />
                </div>
                <div>
                  <Label>Password</Label>
                  <Input type="password" value={formData.password} onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))} required />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-lg">Permissions</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    <span>Select All</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-5 bg-gray-50 rounded-lg border">
                  {menuPermissions.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={formData.permissions[p.id as keyof typeof formData.permissions]}
                        onCheckedChange={(c) => setFormData(prev => ({
                          ...prev,
                          permissions: { ...prev.permissions, [p.id]: c }
                        }))}
                      />
                      <Label className="cursor-pointer">{p.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? "Update" : "Create"} Admin
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All Admin Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Password</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                    No admin accounts yet. Create one!
                  </TableCell>
                </TableRow>
              ) : (
                roles.map(role => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.username}</TableCell>
                    <TableCell>••••••••</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(role.permissions).filter(k => role.permissions[k]).map(key => (
                          <span key={key} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {menuPermissions.find(p => p.id === key)?.label || key}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(role.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleEdit(role)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDelete(role.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}