// utils/stringUtils.js
const crypto = require('crypto');

const stringUtils = {
  // Capitalize first letter
  capitalize: (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  },

  // Capitalize each word
  capitalizeWords: (str) => {
    if (!str) return '';
    return str.replace(/\b\w/g, char => char.toUpperCase());
  },

  // Convert to camelCase
  toCamelCase: (str) => {
    if (!str) return '';
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      )
      .replace(/\s+/g, '');
  },

  // Convert to snake_case
  toSnakeCase: (str) => {
    if (!str) return '';
    return str
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('_');
  },

  // Convert to kebab-case
  toKebabCase: (str) => {
    if (!str) return '';
    return str
      .replace(/\W+/g, ' ')
      .split(/ |\B(?=[A-Z])/)
      .map(word => word.toLowerCase())
      .join('-');
  },

  // Convert to PascalCase
  toPascalCase: (str) => {
    if (!str) return '';
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
      .replace(/\s+/g, '');
  },

  // Truncate string
  truncate: (str, length, suffix = '...') => {
    if (!str || str.length <= length) return str;
    return str.substring(0, length - suffix.length) + suffix;
  },

  // Truncate words
  truncateWords: (str, wordCount, suffix = '...') => {
    if (!str) return '';
    const words = str.split(' ');
    if (words.length <= wordCount) return str;
    return words.slice(0, wordCount).join(' ') + suffix;
  },

  // Remove HTML tags
  stripHtml: (str) => {
    if (!str) return '';
    return str.replace(/<[^>]*>/g, '');
  },

  // Remove extra whitespace
  normalizeWhitespace: (str) => {
    if (!str) return '';
    return str.replace(/\s+/g, ' ').trim();
  },

  // Generate slug
  slugify: (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove non-word chars
      .replace(/\s+/g, '-')      // Replace spaces with -
      .replace(/--+/g, '-')      // Replace multiple - with single -
      .replace(/^-+/, '')        // Trim - from start
      .replace(/-+$/, '');       // Trim - from end
  },

  // Generate random string
  randomString: (length = 10, charset = 'alphanumeric') => {
    const charsets = {
      alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
      numeric: '0123456789',
      alphanumeric: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
      hex: '0123456789abcdef',
      custom: charset
    };

    const chars = charsets[charset] || charsets.alphanumeric;
    let result = '';

    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  },

  // Generate UUID
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  },

  // Hash string
  hash: (str, algorithm = 'sha256') => {
    return crypto.createHash(algorithm).update(str).digest('hex');
  },

  // Encode base64
  base64Encode: (str) => {
    return Buffer.from(str).toString('base64');
  },

  // Decode base64
  base64Decode: (str) => {
    return Buffer.from(str, 'base64').toString('utf-8');
  },

  // Escape HTML
  escapeHtml: (str) => {
    if (!str) return '';
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
  },

  // Unescape HTML
  unescapeHtml: (str) => {
    if (!str) return '';
    const htmlUnescapes = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'"
    };
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, entity => htmlUnescapes[entity]);
  },

  // Format template string
  template: (str, data) => {
    if (!str) return '';
    return str.replace(/\${(\w+)}/g, (match, key) => {
      return data.hasOwnProperty(key) ? data[key] : match;
    });
  },

  // Pad string
  padLeft: (str, length, char = ' ') => {
    str = String(str);
    return str.padStart(length, char);
  },

  padRight: (str, length, char = ' ') => {
    str = String(str);
    return str.padEnd(length, char);
  },

  // Check if string contains
  contains: (str, search, caseSensitive = false) => {
    if (!str || !search) return false;
    if (caseSensitive) {
      return str.includes(search);
    }
    return str.toLowerCase().includes(search.toLowerCase());
  },

  // Count occurrences
  countOccurrences: (str, search) => {
    if (!str || !search) return 0;
    return str.split(search).length - 1;
  },

  // Replace all occurrences
  replaceAll: (str, search, replace) => {
    if (!str) return '';
    return str.split(search).join(replace);
  },

  // Extract numbers from string
  extractNumbers: (str) => {
    if (!str) return [];
    return str.match(/\d+/g)?.map(Number) || [];
  },

  // Extract emails from string
  extractEmails: (str) => {
    if (!str) return [];
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    return str.match(emailRegex) || [];
  },

  // Extract URLs from string
  extractUrls: (str) => {
    if (!str) return [];
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
    return str.match(urlRegex) || [];
  },

  // Extract hashtags
  extractHashtags: (str) => {
    if (!str) return [];
    const hashtagRegex = /#[a-zA-Z0-9_]+/g;
    return str.match(hashtagRegex) || [];
  },

  // Convert Thai numerals to Arabic
  thaiToArabicNumerals: (str) => {
    if (!str) return '';
    const thaiNumerals = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    let result = str;
    thaiNumerals.forEach((thai, index) => {
      result = result.replace(new RegExp(thai, 'g'), index.toString());
    });
    return result;
  },

  // Convert Arabic numerals to Thai
  arabicToThaiNumerals: (str) => {
    if (!str) return '';
    const thaiNumerals = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
    return str.replace(/\d/g, digit => thaiNumerals[parseInt(digit)]);
  },

  // Format Thai name
  formatThaiName: (firstName, lastName) => {
    if (!firstName) return '';
    
    // Common Thai titles
    const titles = ['นาย', 'นาง', 'นางสาว', 'คุณ', 'ดร.', 'ศ.', 'รศ.', 'ผศ.'];
    let formattedFirst = firstName;
    
    // Remove title if included in firstName
    titles.forEach(title => {
      if (firstName.startsWith(title)) {
        formattedFirst = firstName.substring(title.length).trim();
      }
    });
    
    return lastName ? `${formattedFirst} ${lastName}` : formattedFirst;
  },

  // Generate initials
  getInitials: (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  },

  // Reverse string
  reverse: (str) => {
    if (!str) return '';
    return str.split('').reverse().join('');
  },

  // Check palindrome
  isPalindrome: (str) => {
    if (!str) return false;
    const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleaned === cleaned.split('').reverse().join('');
  },

  // Word count
  wordCount: (str) => {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(word => word.length > 0).length;
  },

  // Character count (excluding spaces)
  charCount: (str, excludeSpaces = false) => {
    if (!str) return 0;
    return excludeSpaces ? str.replace(/\s/g, '').length : str.length;
  },

  // Generate Lorem Ipsum
  loremIpsum: (wordCount = 50) => {
    const words = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur',
      'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor',
      'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna',
      'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis',
      'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
      'aliquip', 'ex', 'ea', 'commodo', 'consequat'
    ];

    const result = [];
    for (let i = 0; i < wordCount; i++) {
      result.push(words[Math.floor(Math.random() * words.length)]);
    }

    return stringUtils.capitalize(result.join(' ')) + '.';
  },

  // Highlight text
  highlight: (text, search, className = 'highlight') => {
    if (!text || !search) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.replace(regex, `<span class="${className}">$1</span>`);
  },

  // Convert to title case
  toTitleCase: (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },

  // Remove accents
  removeAccents: (str) => {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  },

  // Format file size
  formatBytes: (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  // Generate readable ID
  generateReadableId: (prefix = '', length = 8) => {
    const timestamp = Date.now().toString(36);
    const random = stringUtils.randomString(length - timestamp.length, 'alphanumeric');
    return prefix ? `${prefix}_${timestamp}${random}` : `${timestamp}${random}`;
  },

  // Mask sensitive data
  mask: (str, showFirst = 3, showLast = 3, maskChar = '*') => {
    if (!str || str.length <= showFirst + showLast) return str;
    const first = str.substring(0, showFirst);
    const last = str.substring(str.length - showLast);
    const masked = maskChar.repeat(str.length - showFirst - showLast);
    return first + masked + last;
  },

  // Format phone number
  formatPhoneNumber: (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length === 10 && cleaned.startsWith('0')) {
      // Thai mobile format: 081-234-5678
      return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    } else if (cleaned.length === 9) {
      // Thai landline format: 02-123-4567
      return `${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}-${cleaned.substring(5)}`;
    }
    
    return phone;
  },

  // Parse query string
  parseQueryString: (str) => {
    if (!str) return {};
    const params = {};
    const pairs = str.replace(/^\?/, '').split('&');
    
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) {
        params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
      }
    });
    
    return params;
  },

  // Build query string
  buildQueryString: (params) => {
    const pairs = Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    
    return pairs.length > 0 ? '?' + pairs.join('&') : '';
  }
};

module.exports = stringUtils;
