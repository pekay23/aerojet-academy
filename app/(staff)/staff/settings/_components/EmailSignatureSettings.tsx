"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import EmailSignature from '@/components/ui/EmailSignature';

interface SignatureData {
    logoUrl?: string;
    name: string;
    role: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    services: string;
    primaryColor: string;
    accentColor: string;
}

export default function EmailSignatureSettings() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [formData, setFormData] = useState<SignatureData>({
        logoUrl: '',
        name: 'Your Name',
        role: 'Your Role',
        phone: '+000 000 000 000',
        email: 'email@example.com',
        website: 'example.com',
        address: 'Address Line, City, Country',
        services: 'Service 1 • Service 2 • Service 3',
        primaryColor: '#0A5C7A',
        accentColor: '#C84B4B'
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('/api/staff/email-signature');
            const data = await response.json();
            if (data.signature) {
                setFormData(data.signature);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            toast.error('Failed to load signature settings');
        } finally {
            setFetching(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/staff/email-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Email signature saved successfully!');
            } else {
                console.error('Server error:', data);
                toast.error(`Failed to save signature: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error saving signature:', error);
            toast.error(`Error saving signature: ${String(error)}`);
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: keyof SignatureData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    if (fetching) {
        return <div className="text-sm text-gray-500">Loading signature settings...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Email Signature</CardTitle>
                <CardDescription>
                    Customize your organization&apos;s email signature template
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Logo URL</label>
                        <Input
                            value={formData.logoUrl || ''}
                            onChange={(e) => updateField('logoUrl', e.target.value)}
                            placeholder="https://example.com/logo.png"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Full Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => updateField('name', e.target.value)}
                            placeholder="Samuel Hughes"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Role/Title</label>
                        <Input
                            value={formData.role}
                            onChange={(e) => updateField('role', e.target.value)}
                            placeholder="Engineering & Facilities Supervisor"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Phone Number</label>
                        <Input
                            value={formData.phone}
                            onChange={(e) => updateField('phone', e.target.value)}
                            placeholder="+233 551 010 108"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Email Address</label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => updateField('email', e.target.value)}
                            placeholder="email@domain.com"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Website</label>
                        <Input
                            value={formData.website}
                            onChange={(e) => updateField('website', e.target.value)}
                            placeholder="example.com"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium mb-2 block">Address</label>
                        <Input
                            value={formData.address}
                            onChange={(e) => updateField('address', e.target.value)}
                            placeholder="3rd Mukose Link, Accra, Ghana"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="text-sm font-medium mb-2 block">Services (separate with •)</label>
                        <Input
                            value={formData.services}
                            onChange={(e) => updateField('services', e.target.value)}
                            placeholder="FM • Engineering • Finishing • Logistics & Operations Support"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Primary Color</label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={formData.primaryColor}
                                onChange={(e) => updateField('primaryColor', e.target.value)}
                                className="w-20 h-10 p-1"
                            />
                            <Input
                                value={formData.primaryColor}
                                onChange={(e) => updateField('primaryColor', e.target.value)}
                                placeholder="#0A5C7A"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Accent Color</label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={formData.accentColor}
                                onChange={(e) => updateField('accentColor', e.target.value)}
                                className="w-20 h-10 p-1"
                            />
                            <Input
                                value={formData.accentColor}
                                onChange={(e) => updateField('accentColor', e.target.value)}
                                placeholder="#C84B4B"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                <div>
                    <h3 className="text-sm font-semibold mb-3">Preview</h3>
                    <EmailSignature {...formData} />
                </div>

                {/* Save Button */}
                <Button onClick={handleSave} disabled={loading} className="w-full md:w-auto">
                    {loading ? 'Saving...' : 'Save Email Signature'}
                </Button>
            </CardContent>
        </Card>
    );
}
