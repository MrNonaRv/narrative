import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Trash2, AlertTriangle, Users, UserPlus, Save, X } from 'lucide-react';

export default function Settings() {
  const { 
    profile, entries, setProfile, clearAllData, 
    currentAccountId, savedAccounts, saveCurrentAccount, switchAccount, createNewAccount, deleteAccount 
  } = useAppStore();
  
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  // Auto-save the current account whenever profile details change
  useEffect(() => {
    saveCurrentAccount();
  }, [profile, saveCurrentAccount]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({ [name]: name === 'requiredHours' ? parseInt(value) || 0 : value });
  };

  const handleClearData = () => {
    clearAllData();
    setShowConfirmClear(false);
  };

  const confirmCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStudentName.trim() === '') return;
    createNewAccount(newStudentName.trim());
    setNewStudentName('');
    setShowAddModal(false);
  };

  const confirmDeleteAccount = () => {
    if (accountToDelete) {
      deleteAccount(accountToDelete);
      setAccountToDelete(null);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl relative">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your profile and report details.</p>
      </div>

      {/* Add New Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="border-b border-border bg-muted/50 rounded-t-xl py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Add New Student</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)} className="h-8 w-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={confirmCreateAccount} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newStudentName">Student's Full Name</Label>
                  <Input 
                    id="newStudentName"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="Enter full name"
                    autoFocus
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    This will securely save the current student and instantly open a fresh dashboard.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={!newStudentName.trim()}>
                    Create & Switch
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Account Modal */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-sm shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <CardHeader className="border-b border-border bg-muted/50 rounded-t-xl py-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Delete Student
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setAccountToDelete(null)} className="h-8 w-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-sm">
                Are you sure you want to completely remove this student's data? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAccountToDelete(null)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={confirmDeleteAccount}>
                  Delete Forever
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Switch Active Student
          </CardTitle>
          <CardDescription>
            You can keep track of multiple students on this device. Create a new slot to start fresh, and easily switch back later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3">
            {savedAccounts.map((account) => {
              const isActive = account.id === currentAccountId;
              const displayProfile = isActive ? profile : account.profile;
              const displayEntriesLength = isActive ? entries.length : (account.entries?.length || 0);

              return (
              <div key={account.id} className={`flex items-center justify-between p-3 border rounded-lg ${isActive ? 'bg-primary/5 border-primary shadow-sm' : 'bg-card hover:bg-muted/50'}`}>
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">
                    {displayProfile?.name || "Unnamed Student"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {displayEntriesLength} Entries · {displayProfile?.courseAndYear || "No Course"}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {!isActive ? (
                    <Button variant="secondary" size="sm" onClick={() => switchAccount(account.id)}>
                      Switch
                    </Button>
                  ) : (
                    <span className="text-xs font-semibold px-2 py-1 bg-primary text-primary-foreground rounded-md">
                      Active
                    </span>
                  )}
                  {savedAccounts.length > 1 && !isActive && (
                    <Button variant="ghost" size="icon" onClick={() => setAccountToDelete(account.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            )})}
          </div>

          <Button variant="outline" className="w-full mt-2" onClick={() => setShowAddModal(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Add New Student
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Profile</CardTitle>
          <CardDescription>This information will appear on your exported reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" value={profile?.name || ''} onChange={handleChange} placeholder="e.g. Arjay A. Bayot" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="courseAndYear">Course and Year</Label>
              <Input id="courseAndYear" name="courseAndYear" value={profile?.courseAndYear || ''} onChange={handleChange} placeholder="e.g. BSCS 4A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="major">Major (Optional)</Label>
              <Input id="major" name="major" value={profile?.major || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="requiredHours">Required OJT Hours</Label>
            <Input id="requiredHours" name="requiredHours" type="number" value={profile?.requiredHours || ''} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Student Signature</Label>
              <div className="border-2 border-dashed border-muted rounded-xl p-4 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setProfile({ signatureImageUrl: evt.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {profile?.signatureImageUrl ? (
                  <div className="relative group w-full flex justify-center">
                    <img src={profile?.signatureImageUrl} alt="Signature" className="max-h-24 object-contain" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        setProfile({ signatureImageUrl: '' });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <Save className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to upload signature</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-semibold">Certificate of Completion</Label>
              <div className="border-2 border-dashed border-muted rounded-xl p-4 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        setProfile({ certificateImageUrl: evt.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {profile?.certificateImageUrl ? (
                  <div className="relative group w-full flex justify-center">
                    <img src={profile?.certificateImageUrl} alt="Certificate" className="max-h-24 object-contain shadow-sm" />
                    <Button 
                      variant="destructive" 
                      size="icon" 
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.preventDefault();
                        setProfile({ certificateImageUrl: '' });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <Save className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Click to upload certificate</span>
                  </div>
                )}
              </div>
            </div>
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
            <Input id="hostEstablishment" name="hostEstablishment" value={profile?.hostEstablishment || ''} onChange={handleChange} placeholder="e.g. Digital Business Training Center" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="headOffice">Head / Supervisor Name</Label>
            <Input id="headOffice" name="headOffice" value={profile?.headOffice || ''} onChange={handleChange} placeholder="e.g. Jay Jay Gurango" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Supervisor Position</Label>
            <Input id="position" name="position" value={profile?.position || ''} onChange={handleChange} placeholder="e.g. President" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Company Address</Label>
            <Input id="address" name="address" value={profile?.address || ''} onChange={handleChange} placeholder="e.g. Pueblo de Panay, Roxas" />
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
            <Input id="facilitator" name="facilitator" value={profile?.facilitator || ''} onChange={handleChange} placeholder="e.g. Prof. Judith L. Vista" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Permanently delete all your Daily Entries, Weekly Reports, Monthly Reports, and reset your Profile settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showConfirmClear ? (
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => setShowConfirmClear(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-4">
              <p className="text-sm text-red-800 font-medium">Are you absolutely sure you want to clear all data? This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowConfirmClear(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-600 text-white hover:bg-red-700" onClick={handleClearData}>
                  Yes, Delete Everything
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
