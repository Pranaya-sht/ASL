'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FaUpload, FaSignOutAlt } from 'react-icons/fa';
import ImageCropper from '@/components/ui/imagecropper';
import { Toaster, toast } from 'react-hot-toast';

const ProfilePage = () => {
    const router = useRouter();
    const [userData, setUserData] = useState(null);
    const [bio, setBio] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [previewURL, setPreviewURL] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const [cropImageSrc, setCropImageSrc] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) {
                router.push('/login');
                return;
            }

            try {
                const res = await fetch('http://localhost:8000/users/me', {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!res.ok) throw new Error('Failed to fetch user');

                const data = await res.json();
                setUserData(data);
                setBio(data.user.bio || '');
            } catch (err) {
                console.error(err);
                toast.error('Failed to fetch user profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [router]);

    const handleCropped = (croppedFile) => {
        setImageFile(croppedFile);
        setPreviewURL(URL.createObjectURL(croppedFile));
        setCropImageSrc(null);
    };

    const handleImageUpload = async () => {
        if (!imageFile) return;

        const formData = new FormData();
        formData.append('file', imageFile);

        try {
            const res = await fetch('http://localhost:8000/users/me/profile-image', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Image uploaded!');
                setUserData(prev => ({
                    ...prev,
                    user: {
                        ...prev.user,
                        profile_image_url: data.profile_image_url,
                    },
                }));
                setPreviewURL(null);
            } else {
                toast.error(data.detail || 'Image upload failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Something went wrong during upload.');
        }
    };

    const handleBioUpdate = async () => {
        try {
            const res = await fetch('http://localhost:8000/users/me', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ bio, profile_image_url: null }),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success('Bio updated!');
            } else {
                toast.error(data.detail || 'Bio update failed');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update bio.');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        router.push('/login');
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCropImageSrc(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return <div className="text-center mt-10">Loading...</div>;
    if (!userData) return <div className="text-center mt-10">No user data</div>;

    const { user, analytics } = userData;

    return (
        <div className="max-w-5xl mx-auto mt-10 px-4 sm:px-6 lg:px-8">
            {/* Toast container */}
            <Toaster position="top-right" />

            <Card className="p-6 rounded-2xl shadow-md">
                <div className="flex flex-col items-center space-y-4">
                    <Avatar className="w-32 h-32 rounded-full overflow-hidden">
                        <AvatarImage
                            src={previewURL || `http://localhost:8000${user.profile_image_url}`}
                            alt="User Avatar"
                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                        <AvatarFallback>{user.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                    <Button onClick={handleImageUpload} className="gap-2">
                        <FaUpload /> Upload Image
                    </Button>

                    <h1 className="text-3xl font-bold">Welcome, {user.username} 👋</h1>

                    <div className="w-full max-w-md text-left space-y-2">
                        <Label htmlFor="bio">Your Bio</Label>
                        <Input
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us something cool..."
                        />
                        <Button onClick={handleBioUpdate} className="mt-2 w-full bg-green-600 hover:bg-green-500">
                            Save Bio
                        </Button>
                    </div>

                    <div className="text-sm text-gray-600 text-center">
                        <p>Email: {user.email}</p>
                        <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                </div>
            </Card>

            <h2 className="text-2xl font-semibold mt-10 mb-4 text-center">📊 Your Analytics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    ['Total Learning Minutes', analytics.total_learning_minutes],
                    ['Total Predictions', analytics.total_predictions],
                    ['Total Translations', analytics.total_translations],
                    ['Lessons Completed', analytics.lessons_completed],
                ].map(([label, value]) => (
                    <Card key={label} className="p-4 shadow hover:shadow-md transition">
                        <CardContent>
                            <p className="font-medium text-gray-600">{label}</p>
                            <p className="text-2xl font-bold">{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="text-center mt-8">
                <Button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-500 text-white gap-2"
                >
                    <FaSignOutAlt /> Logout
                </Button>
            </div>

            {cropImageSrc && (
                <ImageCropper
                    image={cropImageSrc}
                    onCropComplete={handleCropped}
                    onCancel={() => setCropImageSrc(null)}
                />
            )}
        </div>
    );
};

export default ProfilePage;
