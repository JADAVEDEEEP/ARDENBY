'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { profileRequest, unwrap } from '../services/profile-api';

import type {
  Address,
  Order,
  Section,
  UserProfile,
  WishlistItem,
} from '../components/profile/types';

export function useProfile() {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('ardenby_token')
      : null;

  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [activeSection, setActiveSection] =
    useState<Section>('overview');

  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [editingAccount, setEditingAccount] =
    useState(false);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');

  const [showAddressForm, setShowAddressForm] =
    useState(false);

  const [editingAddressId, setEditingAddressId] =
    useState<string | null>(null);

  const [addressForm, setAddressForm] = useState({
    name: '',
    phone: '',
    pincode: '',
    address: '',
    city: '',
    state: '',
    address_type: 'Home',
    is_default: false,
  });

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [deletePassword, setDeletePassword] =
    useState('');

  const [showDeletePassword, setShowDeletePassword] =
    useState(false);

  const [deleteLoading, setDeleteLoading] =
    useState(false);

  const loadUser = async () => {
    const data = await profileRequest('/api/users/me');

    const profile = unwrap(data, [
      'user',
      'data',
      'profile',
    ]);

    setUser(profile);

    setFullName(
      profile?.full_name ||
        profile?.fullName ||
        ''
    );

    setPhone(profile?.phone || '');
    setGender(profile?.gender || '');
  };

  const loadSection = async (section: Section) => {
    setSectionLoading(true);
    setError('');

    try {
      if (section === 'orders') {
        const data =
          await profileRequest('/api/orders/my');

        setOrders(
          unwrap(data, ['orders', 'data']) || []
        );
      }

      if (section === 'wishlist') {
        const data =
          await profileRequest('/api/wishlist/');

        setWishlist(
          unwrap(data, [
            'wishlist',
            'items',
            'data',
          ]) || []
        );
      }

      if (section === 'addresses') {
        const data =
          await profileRequest('/api/addresses');

        setAddresses(
          unwrap(data, [
            'addresses',
            'data',
          ]) || []
        );
      }

      // Coupons are currently customer-facing data
      // from the existing coupon API.
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        logout();
        return;
      }

      setError(
        err.message ||
          'Unable to load this section.'
      );
    } finally {
      setSectionLoading(false);
    }
  };

  // ============================================================
  // WISHLIST
  // ============================================================

  const addToWishlist = async (productId: string) => {
    try {
      setError('');
      setMessage('');

      await profileRequest('/api/wishlist', {
        method: 'POST',
        body: JSON.stringify({
          productId,
        }),
      });

      await loadSection('wishlist');

      setMessage('Added to wishlist.');
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        logout();
        return;
      }

      setError(
        err.message ||
          'Unable to add product to wishlist.'
      );
    }
  };

  const checkWishlist = async (productId: string) => {
    try {
      const data =
        await profileRequest(
          `/api/wishlist/check/${encodeURIComponent(
            productId
          )}`
        );

      return Boolean(
        data?.isWishlisted ??
          data?.inWishlist ??
          data?.wishlisted ??
          data?.data?.isWishlisted ??
          data?.data?.inWishlist
      );
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        logout();
        return false;
      }

      setError(
        err.message ||
          'Unable to check wishlist.'
      );

      return false;
    }
  };

  const removeFromWishlist = async (
    productId: string
  ) => {
    try {
      setError('');
      setMessage('');

      await profileRequest(
        `/api/wishlist/${encodeURIComponent(
          productId
        )}`,
        {
          method: 'DELETE',
        }
      );

      await loadSection('wishlist');

      setMessage('Removed from wishlist.');
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        logout();
        return;
      }

      setError(
        err.message ||
          'Unable to remove product from wishlist.'
      );
    }
  };

  const clearWishlist = async () => {
    try {
      setError('');
      setMessage('');

      await profileRequest('/api/wishlist', {
        method: 'DELETE',
      });

      setWishlist([]);

      setMessage('Wishlist cleared.');
    } catch (err: any) {
      if (err.message === 'AUTH_REQUIRED') {
        logout();
        return;
      }

      setError(
        err.message ||
          'Unable to clear wishlist.'
      );
    }
  };

  useEffect(() => {
    if (!token) {
      router.replace('/');
      return;
    }

    (async () => {
      try {
        await loadUser();
      } catch {
        localStorage.removeItem(
          'ardenby_token'
        );

        router.replace('/');
      } finally {
        setLoading(false);
      }
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && user) {
      loadSection(activeSection);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, loading, user]);

  const logout = () => {
    localStorage.removeItem(
      'ardenby_token'
    );

    setUser(null);

    window.dispatchEvent(
      new Event('ardenby-auth-changed')
    );

    router.replace('/');
  };

  const updateAccount = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSectionLoading(true);
    setError('');
    setMessage('');

    try {
      const data =
        await profileRequest(
          '/api/users/me',
          {
            method: 'PUT',
            body: JSON.stringify({
              fullName,
              phone,
              gender,
            }),
          }
        );

      const updated = unwrap(data, [
        'user',
        'data',
        'profile',
      ]);

      setUser(
        updated || {
          ...user,
          full_name: fullName,
          phone,
          gender,
        }
      );

      setEditingAccount(false);

      setMessage(
        'Account details updated successfully.'
      );
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to update account details.'
      );
    } finally {
      setSectionLoading(false);
    }
  };

  // ============================================================
  // OPEN DELETE MODAL
  // ============================================================

  const openDeleteModal = () => {
    setError('');
    setMessage('');
    setDeletePassword('');
    setShowDeletePassword(false);
    setShowDeleteModal(true);
  };

  // ============================================================
  // DELETE ACCOUNT
  // EMAIL  -> PASSWORD REQUIRED
  // GOOGLE -> NO PASSWORD
  // ============================================================

  const deleteAccount = async () => {
    if (!user) return;

    const isGoogleAccount =
      user.auth_provider === 'google';

    // Email/password account
    if (
      !isGoogleAccount &&
      !deletePassword.trim()
    ) {
      setError(
        'Password is required to delete your account.'
      );
      return;
    }

    setDeleteLoading(true);
    setError('');

    try {
      const payload = isGoogleAccount
        ? {}
        : {
            password: deletePassword,
          };

      await profileRequest('/api/users/me', {
        method: 'DELETE',
        body: JSON.stringify(payload),
      });

      // Clear local authentication
      localStorage.removeItem(
        'ardenby_token'
      );

      setUser(null);
      setShowDeleteModal(false);
      setDeletePassword('');

      window.dispatchEvent(
        new Event('ardenby-auth-changed')
      );

      router.replace('/');
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to delete your account.'
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      name: user?.full_name || '',
      phone: user?.phone || '',
      pincode: '',
      address: '',
      city: '',
      state: '',
      address_type: 'Home',
      is_default: false,
    });

    setEditingAddressId(null);
  };

  const saveAddress = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setSectionLoading(true);
    setError('');
    setMessage('');

    try {
      const payload = {
        name: addressForm.name,
        phone: addressForm.phone,
        pincode: addressForm.pincode,
        address: addressForm.address,
        city: addressForm.city,
        state: addressForm.state,
        addressType:
          addressForm.address_type,
        isDefault:
          addressForm.is_default,
      };

      if (editingAddressId) {
        await profileRequest(
          `/api/addresses/${editingAddressId}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
      } else {
        await profileRequest(
          '/api/addresses',
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );
      }

      setShowAddressForm(false);
      resetAddressForm();

      await loadSection('addresses');

      setMessage(
        'Address saved successfully.'
      );
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to save address.'
      );
    } finally {
      setSectionLoading(false);
    }
  };

  const editAddress = (
    address: Address
  ) => {
    setEditingAddressId(address.id);

    setAddressForm({
      name: address.name,
      phone: address.phone,
      pincode: address.pincode,
      address: address.address,
      city: address.city,
      state: address.state,
      address_type:
        address.address_type || 'Home',
      is_default: Boolean(
        address.is_default
      ),
    });

    setShowAddressForm(true);
  };

  const deleteAddress = async (
    id: string
  ) => {
    if (
      !window.confirm(
        'Delete this saved address?'
      )
    ) {
      return;
    }

    try {
      await profileRequest(
        `/api/addresses/${id}`,
        {
          method: 'DELETE',
        }
      );

      await loadSection('addresses');

      setMessage(
        'Address deleted.'
      );
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to delete address.'
      );
    }
  };

  const setDefaultAddress = async (
    id: string
  ) => {
    try {
      await profileRequest(
        `/api/addresses/${id}/default`,
        {
          method: 'PATCH',
        }
      );

      await loadSection('addresses');

      setMessage(
        'Default address updated.'
      );
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to update default address.'
      );
    }
  };

  const cancelOrder = async (
    id: string
  ) => {
    if (
      !window.confirm(
        'Cancel this order?'
      )
    ) {
      return;
    }

    try {
      await profileRequest(
        `/api/orders/${id}/cancel`,
        {
          method: 'PATCH',
        }
      );

      await loadSection('orders');

      setMessage(
        'Order cancelled successfully.'
      );
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to cancel order.'
      );
    }
  };

  const changePassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setError(
        'New password must be at least 6 characters.'
      );

      return;
    }

    if (
      newPassword !== confirmPassword
    ) {
      setError(
        'New password and confirmation do not match.'
      );

      return;
    }

    setSectionLoading(true);
    setError('');
    setMessage('');

    try {
      await profileRequest(
        '/api/users/me/password',
        {
          method: 'PUT',
          body: JSON.stringify({
            oldPassword,
            newPassword,
          }),
        }
      );

      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setMessage(
        'Password changed successfully.'
      );
    } catch (err: any) {
      setError(
        err.message ||
          'Unable to change password.'
      );
    } finally {
      setSectionLoading(false);
    }
  };

  const money = (value: number) =>
    `₹${Number(
      value || 0
    ).toLocaleString('en-IN', {
      maximumFractionDigits: 2,
    })}`;

  const statusClass = (
    status: string
  ) => {
    if (status === 'Delivered')
      return 'bg-green-50 text-green-700';

    if (status === 'Cancelled')
      return 'bg-red-50 text-red-700';

    if (status === 'Returned')
      return 'bg-orange-50 text-orange-700';

    return 'bg-[#EFECE6] text-[#5C554E]';
  };

  const displayName =
    user?.full_name || 'ARDENBY Member';

  const initial =
    displayName.charAt(0).toUpperCase();

  const isGoogleAccount =
    user?.auth_provider === 'google';

  return {
    router,
    user,
    orders,
    wishlist,
    addresses,
    activeSection,
    setActiveSection,
    loading,
    sectionLoading,
    error,
    setError,
    message,
    setMessage,
    editingAccount,
    setEditingAccount,
    fullName,
    setFullName,
    phone,
    setPhone,
    gender,
    setGender,
    showAddressForm,
    setShowAddressForm,
    editingAddressId,
    addressForm,
    setAddressForm,
    oldPassword,
    setOldPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showDeleteModal,
    setShowDeleteModal,
    deletePassword,
    setDeletePassword,
    showDeletePassword,
    setShowDeletePassword,
    deleteLoading,
    displayName,
    initial,
    isGoogleAccount,
    logout,
    loadSection,
    addToWishlist,
    checkWishlist,
    removeFromWishlist,
    clearWishlist,
    updateAccount,
    openDeleteModal,
    deleteAccount,
    resetAddressForm,
    saveAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress,
    cancelOrder,
    changePassword,
    money,
    statusClass,
  };
}