"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy } from 'lucide-react';

interface EmailSignatureProps {
    logoUrl?: string;
    name: string;
    role: string;
    phone: string;
    email: string;
    website: string;
    address: string;
    services: string;
    primaryColor?: string;
    accentColor?: string;
}

export default function EmailSignature({
    logoUrl,
    name,
    role,
    phone,
    email,
    website,
    address,
    services,
    primaryColor = '#0A5C7A',
    accentColor = '#C84B4B'
}: EmailSignatureProps) {

    const generateHtmlSignature = () => {
        return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.4; color: #333;">
  <tr>
    <td style="padding-right: 20px; vertical-align: middle;">
      ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="width: 200px; height: auto; display: block;" />` : ''}
    </td>
    <td style="padding-left: 20px; vertical-align: middle;">
      <div style="margin-bottom: 10px;">
        <div style="font-size: 18px; font-weight: bold; color: ${primaryColor}; margin-bottom: 2px;">${name}</div>
        <div style="font-size: 13px; color: #666; border-bottom: 2px solid ${accentColor}; padding-bottom: 8px; display: inline-block;">${role}</div>
      </div>
      <div style="margin-bottom: 12px; font-size: 13px;">
        <div style="margin-bottom: 3px;">${phone}</div>
        <div style="margin-bottom: 3px;"><a href="mailto:${email}" style="color: #333; text-decoration: none;">${email}</a></div>
        <div style="margin-bottom: 3px;"><a href="https://${website}" style="color: #333; text-decoration: none;">${website}</a></div>
        <div>${address}</div>
      </div>
      <div style="font-size: 12px; color: ${primaryColor}; font-weight: 600;">
        ${services}
      </div>
    </td>
  </tr>
</table>
    `.trim();
    };

    const copyToClipboard = async () => {
        try {
            const html = generateHtmlSignature();

            // Create a blob with HTML content
            const blob = new Blob([html], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });

            await navigator.clipboard.write([clipboardItem]);
            toast.success('Email signature copied to clipboard!');
        } catch (error) {
            // Fallback to plain text copy
            try {
                await navigator.clipboard.writeText(generateHtmlSignature());
                toast.success('Email signature HTML copied to clipboard!');
            } catch (fallbackError) {
                toast.error('Failed to copy signature');
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="border rounded-lg p-6 bg-white">
                <table cellPadding="0" cellSpacing="0" style={{ fontFamily: 'Arial, sans-serif', fontSize: '14px', lineHeight: '1.4', color: '#333' }}>
                    <tbody>
                        <tr>
                            <td style={{ paddingRight: '20px', verticalAlign: 'middle' }}>
                                {logoUrl && (
                                    <img
                                        src={logoUrl}
                                        alt="Logo"
                                        style={{ width: '200px', height: 'auto', display: 'block' }}
                                    />
                                )}
                            </td>
                            <td style={{ paddingLeft: '20px', verticalAlign: 'middle' }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: primaryColor, marginBottom: '2px' }}>
                                        {name}
                                    </div>
                                    <div style={{
                                        fontSize: '13px',
                                        color: '#666',
                                        borderBottom: `2px solid ${accentColor}`,
                                        paddingBottom: '8px',
                                        display: 'inline-block'
                                    }}>
                                        {role}
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px', fontSize: '13px' }}>
                                    <div style={{ marginBottom: '3px' }}>
                                        {phone}
                                    </div>
                                    <div style={{ marginBottom: '3px' }}>
                                        <a href={`mailto:${email}`} style={{ color: '#333', textDecoration: 'none' }}>
                                            {email}
                                        </a>
                                    </div>
                                    <div style={{ marginBottom: '3px' }}>
                                        <a href={`https://${website}`} style={{ color: '#333', textDecoration: 'none' }}>
                                            {website}
                                        </a>
                                    </div>
                                    <div>
                                        {address}
                                    </div>
                                </div>
                                <div style={{ fontSize: '12px', color: primaryColor, fontWeight: 600 }}>
                                    {services}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <Button onClick={copyToClipboard} className="w-full sm:w-auto">
                <Copy className="w-4 h-4 mr-2" />
                Copy HTML Signature
            </Button>
        </div>
    );
}
