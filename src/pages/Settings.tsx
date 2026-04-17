import React from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function Settings() {
  const { profile, setProfile } = useAppStore();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({ [name]: name === 'requiredHours' ? parseInt(value) || 0 : value });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your profile and report details.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Profile</CardTitle>
          <CardDescription>This information will appear on your exported reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" value={profile.name} onChange={handleChange} placeholder="e.g. Arjay A. Bayot" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseAndYear">Course and Year</Label>
              <Input id="courseAndYear" name="courseAndYear" value={profile.courseAndYear} onChange={handleChange} placeholder="e.g. BSCS 4A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major (Optional)</Label>
              <Input id="major" name="major" value={profile.major} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requiredHours">Required OJT Hours</Label>
            <Input id="requiredHours" name="requiredHours" type="number" value={profile.requiredHours} onChange={handleChange} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Host Establishment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hostEstablishment">Company / Establishment Name</Label>
            <Input id="hostEstablishment" name="hostEstablishment" value={profile.hostEstablishment} onChange={handleChange} placeholder="e.g. Digital Business Training Center" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="headOffice">Head / Supervisor Name</Label>
            <Input id="headOffice" name="headOffice" value={profile.headOffice} onChange={handleChange} placeholder="e.g. Jay Jay Gurango" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Supervisor Position</Label>
            <Input id="position" name="position" value={profile.position} onChange={handleChange} placeholder="e.g. President" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Company Address</Label>
            <Input id="address" name="address" value={profile.address} onChange={handleChange} placeholder="e.g. Pueblo de Panay, Roxas" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>School Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="facilitator">Facilitator / Professor Name</Label>
            <Input id="facilitator" name="facilitator" value={profile.facilitator} onChange={handleChange} placeholder="e.g. Prof. Judith L. Vista" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
