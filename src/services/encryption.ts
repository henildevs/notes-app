import CryptoJS from 'crypto-js';

class EncryptionService {
  private sessionPasswords: Map<string, string> = new Map();
  encryptNote(content: string, title: string, password: string): {
    encryptedContent: string;
    encryptedTitle: string;
    salt: string;
  } {
    const salt = CryptoJS.lib.WordArray.random(128 / 8).toString();
    const key = this.deriveKey(password, salt);
    const encryptedContent = CryptoJS.AES.encrypt(content, key).toString();
    const encryptedTitle = CryptoJS.AES.encrypt(title, key).toString();
    
    return {
      encryptedContent,
      encryptedTitle,
      salt,
    };
  }

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
      const key = this.deriveKey(password, salt);
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

  private deriveKey(password: string, salt: string): string {
    const iterations = 10000;
    const keySize = 256 / 32;
    
    const key = CryptoJS.PBKDF2(password, salt, {
      keySize,
      iterations,
    });
    
    return key.toString();
  }

  storeSessionPassword(noteId: string, password: string): void {
    this.sessionPasswords.set(noteId, password);
  }

  getSessionPassword(noteId: string): string | undefined {
    return this.sessionPasswords.get(noteId);
  }

  clearSessionPassword(noteId: string): void {
    this.sessionPasswords.delete(noteId);
  }

  clearAllSessionPasswords(): void {
    this.sessionPasswords.clear();
  }

  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;
    
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Password should be at least 8 characters long');
    }
    
    if (password.length >= 12) {
      score += 1;
    }
    
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include lowercase letters');
    }
    
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include uppercase letters');
    }
    
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Include numbers');
    }
    
    if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
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

  generatePassword(length: number = 16): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + special;
    let password = '';
    
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  verifyPassword(password: string, hash: string): boolean {
    return this.hashPassword(password) === hash;
  }
}

export const encryptionService = new EncryptionService();
