import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit, User, Mail, Phone, MapPin } from 'lucide-react';

interface ProfileContentProps {
  userData: {
    name: string;
    email: string;
    phone: string;
    location: string;
    joinDate: string;
    tier: string;
    profileCompletion: number;
  };
  data: {
    membership: {
      isAffiliate: boolean;
      rank: number;
    };
  };
  updateData: (callback: (prev: any) => any) => void;
}

export function ProfileContent({ userData, data, updateData }: ProfileContentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    location: userData.location
  });

  const handleSave = () => {
    updateData((prev: any) => ({
      ...prev,
      user: {
        ...prev.user,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        location: formData.location
      }
    }));
    setIsEditing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </div>
              <Button
                variant={isEditing ? "outline" : "default"}
                onClick={() => isEditing ? setIsEditing(false) : setIsEditing(true)}
              >
                {isEditing ? (
                  <>Cancel</>
                ) : (
                  <>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div className="space-y-2 hidden">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
            </div>

            {isEditing && (
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Membership Details */}
        <Card>
          <CardHeader>
            <CardTitle>Membership Details</CardTitle>
            <CardDescription>
              Your current membership status and benefits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Membership Tier</span>
                  <Badge variant="secondary">{userData.tier}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">{userData.joinDate}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Affiliate Status</span>
                  <Badge variant={data.membership?.isAffiliate ? "default" : "secondary"}>
                    {data.membership?.isAffiliate ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Investment</span>
                  <span className="text-sm font-medium">₹999</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Rank</span>
                  <span className="text-sm font-medium">Rank {data.membership?.rank || 1}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Profile Completion</span>
                  <span className="text-sm font-medium">{userData.profileCompletion}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Profile Completion */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Completion</CardTitle>
            <CardDescription>
              Complete your profile to unlock all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Basic Information</span>
                <Badge variant={userData.name && userData.email ? "default" : "secondary"}>
                  {userData.name && userData.email ? "Complete" : "Incomplete"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Contact Details</span>
                <Badge variant={userData.phone ? "default" : "secondary"}>
                  {userData.phone ? "Complete" : "Incomplete"}
                </Badge>
              </div>
              <div className="flex items-center justify-between hidden">
                <span className="text-sm">Location</span>
                <Badge variant={userData.location !== "Not specified" ? "default" : "secondary"}>
                  {userData.location !== "Not specified" ? "Complete" : "Incomplete"}
                </Badge>
              </div>
              <div className="pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{userData.profileCompletion}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${userData.profileCompletion}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Security */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Account Security</CardTitle>
            <CardDescription>
              Keep your account secure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-muted-foreground">Last changed 2 months ago</p>
              </div>
              <Button variant="outline" size="sm">
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Two-Factor Authentication</p>
                <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
              </div>
              <Button variant="outline" size="sm">
                Enable
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Login Activity</p>
                <p className="text-xs text-muted-foreground">View recent sign-ins</p>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  );
}