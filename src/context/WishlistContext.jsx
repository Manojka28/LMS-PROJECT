import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());

  useEffect(() => {
    if (isAuthenticated && user?.role === 'student') {
      fetchWishlist();
    } else {
      setWishlist([]);
      setWishlistIds(new Set());
    }
  }, [isAuthenticated, user]);

  const fetchWishlist = async () => {
    try {
      const res = await api.get('/student/wishlist');
      if (res.success) {
        setWishlist(res.wishlist);
        const ids = new Set(res.wishlist.map(w => w.course._id));
        setWishlistIds(ids);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    }
  };

  const toggleWishlist = async (courseId) => {
    if (!isAuthenticated || user?.role !== 'student') return false;
    
    // Optimistic UI update
    const isWishlisted = wishlistIds.has(courseId);
    const newIds = new Set(wishlistIds);
    if (isWishlisted) {
      newIds.delete(courseId);
    } else {
      newIds.add(courseId);
    }
    setWishlistIds(newIds);

    try {
      const res = await api.post('/student/wishlist/toggle', { courseId });
      if (res.success) {
        // Refetch to get populated course details for WishlistPage if added
        if (res.isWishlisted) {
          fetchWishlist();
        } else {
          // Just filter out from local state to be fast
          setWishlist(prev => prev.filter(w => w.course._id !== courseId));
        }
        return res.isWishlisted;
      }
    } catch (err) {
      console.error('Toggle wishlist failed', err);
      // Revert optimistic update
      setWishlistIds(wishlistIds); 
    }
    return false;
  };

  const isWishlisted = (courseId) => {
    return wishlistIds.has(courseId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, wishlistIds, toggleWishlist, isWishlisted, fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  return useContext(WishlistContext);
}
