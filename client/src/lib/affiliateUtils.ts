import { getDatabase, ref, set, get } from 'firebase/database';

// Function to get or create affiliate ID for a user
export const getOrCreateAffiliateId = async (userId: string, userEmail: string, userName: string): Promise<string> => {
  const database = getDatabase();
  const affiliateRef = ref(database, `userAffiliateIds/${userId}`);
  
  try {
    // Check if user already has an affiliate ID
    const snapshot = await get(affiliateRef);
    
    if (snapshot.exists()) {
      // Return existing affiliate ID
      return snapshot.val().affiliateId;
    } else {
      // Create new affiliate ID based on user data
      const affiliateId = generateAffiliateIdFromUser(userEmail, userName, userId);
      
      // Save to Firebase
      await set(affiliateRef, {
        affiliateId: affiliateId,
        userEmail: userEmail,
        userName: userName,
        createdAt: new Date().toISOString(),
        userId: userId
      });
      
      return affiliateId;
    }
  } catch (error) {
    console.error('Error getting affiliate ID:', error);
    // Fallback to generated ID
    return generateAffiliateIdFromUser(userEmail, userName, userId);
  }
};

// Function to generate affiliate ID from user data
const generateAffiliateIdFromUser = (email: string, name: string, userId: string): string => {
  // Use email as base (remove special characters, take first part)
  const emailBase = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  
  // Use name initials
  const nameParts = name.split(' ');
  const initials = nameParts.map(part => part.charAt(0)).join('').toLowerCase();
  
  // Use part of userId for uniqueness
  const userIdPart = userId.substring(0, 6);
  
  // Combine and ensure length
  let baseId = `${emailBase}_${initials}_${userIdPart}`;
  
  // If too long, truncate
  if (baseId.length > 20) {
    baseId = baseId.substring(0, 20);
  }
  
  return baseId;
};

// Function to get affiliate ID by user ID
export const getAffiliateIdByUserId = async (userId: string): Promise<string | null> => {
  const database = getDatabase();
  const affiliateRef = ref(database, `userAffiliateIds/${userId}`);
  
  try {
    const snapshot = await get(affiliateRef);
    return snapshot.exists() ? snapshot.val().affiliateId : null;
  } catch (error) {
    console.error('Error fetching affiliate ID:', error);
    return null;
  }
};