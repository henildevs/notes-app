import CryptoJS from 'crypto-js';

class EncryptionService {
  // Store session passwords in memory (cleared on refresh)
  private sessionPasswords: Map<string, string> = new Map();

  /**
   * Encrypt note content with a password
   */
  encryptNote(content: string, title: string, password: string): {
    encryptedContent: string;
    encryptedTitle: string;
    salt: string;
  } {
    // Generate a random salt for this encryption
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    
    // Create a key from the password and salt
    const key = this.deriveKey(password, salt);
    
    // Encrypt the content and title
    const encryptedContent = CryptoJS.AES.encrypt(content, key).toString();
    const encryptedTitle = CryptoJS.AES.encrypt(title, key).toString();
    
    return {
      encryptedContent,
      encryptedTitle,
      salt,
    };
  }

  /**
   * Decrypt note content with a password
   */
  decryptNote(
    encryptedContent: string,
    encryptedTitle: string,
    password: string,
    salt: string
  ): {
    content: string;
    title: string;
  } {
    try {
      // Derive the same key using the password and salt
      const key = this.deriveKey(password, salt);
      
      // Decrypt the content and title
      const decryptedContent = CryptoJS.AES.decrypt(encryptedContent, key);
      const decryptedTitle = CryptoJS.AES.decrypt(encryptedTitle, key);
      
      const content = decryptedContent.toString(CryptoJS.enc.Utf8);
      const title = decryptedTitle.toString(CryptoJS.enc.Utf8);
      
      if (!content || !title) {
        throw new Error('Invalid password');
      }
      
      return { content, title };
    } catch (error) {
      throw new Error('Failed to decrypt note. Please check your password.');
    }
  }

  /**
   * Derive a key from password and salt using PBKDF2
   */
  private deriveKey(password: string, salt: string): string {
    const iterations = 10000;
    const keySize = 256 / 32; // 256 bits
    
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize,
      iterations,
    });
    
    return key.toString();
  }

  /**
   * Store password in session memory for convenience
   */
  storeSessionPassword(noteId: string, password: string): void {
    this.sessionPasswords.set(noteId, password);
  }

  /**
   * Get password from session memory
   */
  getSessionPassword(noteId: string): string | undefined {
    return this.sessionPasswords.get(noteId);
  }

  /**
   * Clear password from session memory
   */
  clearSessionPassword(noteId: string): void {
    this.sessionPasswords.delete(noteId);
  }

  /**
   * Clear all session passwords
   */
  clearAllSessionPasswords(): void {
    this.sessionPasswords.clear();
  }

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    // Check length
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }
    
    if (password.length >= 12) {
      score += 1;
    }
    
    // Check for lowercase letters
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }
    
    // Check for uppercase letters
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }
    
    // Check for numbers
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }
    
    // Check for special characters
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include special characters');
    }
    
    return {
      isValid: score >= 3,
      score: Math.min(5, score),
      feedback,
    };
  }

  /**
   * Generate a strong random password
   */
  generatePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + special;
    let password = '';
    
    // Ensure at least one character from each type
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Hash a password for comparison (not for encryption)
   */
  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  /**
   * Compare a password with a hash
   */
  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
