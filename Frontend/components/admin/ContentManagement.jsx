import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, Search, Filter, 
  Plus, Edit, Trash2, Eye, MoreVertical,
  Image, Video, Clock, User, Tag,
  CheckCircle, XCircle, AlertCircle,
  ArrowLeft, Save, Send, Upload, X,
  Bold, Italic, Underline, Link,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote, Code,
  FolderPlus, Folder, Edit3, Settings,
  Loader, RefreshCw, Type, Heading,
  ImageIcon, LinkIcon, Table,
  Undo, Redo, PaletteIcon
} from 'lucide-react';

// API Functions for database operations
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = {
  // Articles API
  articles: {
    getAll: async (filters = {}) => {
      const params = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/articles?${params}`);
      if (!response.ok) throw new Error('Failed to fetch articles');
      return response.json();
    },
    getById: async (id) => {
      const response = await fetch(`${API_BASE_URL}/articles/${id}`);
      if (!response.ok) throw new Error('Failed to fetch article');
      return response.json();
    },
    create: async (articleData) => {
      const response = await fetch(`${API_BASE_URL}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });
      if (!response.ok) throw new Error('Failed to create article');
      return response.json();
    },
    update: async (id, articleData) => {
      const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData)
      });
      if (!response.ok) throw new Error('Failed to update article');
      return response.json();
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/articles/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete article');
      return response.json();
    },
    getStats: async () => {
      const response = await fetch(`${API_BASE_URL}/articles/stats`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  },
  
  // Categories API
  categories: {
    getAll: async () => {
      const response = await fetch(`${API_BASE_URL}/categories`);
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
    create: async (categoryData) => {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },
    update: async (id, categoryData) => {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryData)
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },
    delete: async (id) => {
      const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete category');
      return response.json();
    }
  },

  // Media API
  media: {
    upload: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/media/upload`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Failed to upload file');
      return response.json();
    }
  }
};

const ContentManagement = ({ windowWidth = 1200 }) => {
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit', 'categories'
  const [editingArticle, setEditingArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  
  // Data from database
  const [articles, setArticles] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    totalViews: 0
  });
  
  // Category management state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    slug: '',
    color: '#232956'
  });
  
  // Article form state
  const [articleForm, setArticleForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    categoryId: null,
    tags: [],
    status: 'draft',
    thumbnail: null,
    publishDate: '',
    author: 'Admin'
  });

  // Article editor state
  const [newTag, setNewTag] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [categories, setCategories] = useState([]);
  
  // Rich Text Editor References
  const editorRef = useRef(null);
  const [editorContent, setEditorContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // CSS Variables
  React.useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', '#232956');
    root.style.setProperty('--accent', '#df2528');
    root.style.setProperty('--success', '#28a745');
    root.style.setProperty('--warning', '#ffc107');
    root.style.setProperty('--danger', '#dc3545');
    root.style.setProperty('--info', '#17a2b8');
    root.style.setProperty('--light', '#f8f9fa');
    root.style.setProperty('--dark', '#343a40');
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8f9fa');
    root.style.setProperty('--text-primary', '#212529');
    root.style.setProperty('--text-secondary', '#6c757d');
    root.style.setProperty('--text-muted', '#adb5bd');
    root.style.setProperty('--border-color', '#dee2e6');
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchArticles();
    fetchCategories();
    fetchStats();
  }, []);

  // Fetch articles with filters
  useEffect(() => {
    const filters = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter !== 'all') filters.status = statusFilter;
    
    const debounceTimer = setTimeout(() => {
      fetchArticles(filters);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, statusFilter]);

  // Database fetch functions
  const fetchArticles = async (filters = {}) => {
    try {
      setArticlesLoading(true);
      setError(null);
      const data = await api.articles.getAll(filters);
      setArticles(data);
    } catch (err) {
      setError('ไม่สามารถโหลดบทความได้: ' + err.message);
      console.error('Error fetching articles:', err);
    } finally {
      setArticlesLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await api.categories.getAll();
      setCategories(data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('ไม่สามารถโหลดหมวดหมู่ได้: ' + err.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.articles.getStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Rich Text Editor Functions
  const formatText = (command, value = null) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    document.execCommand(command, false, value);
    
    // Update content state
    setEditorContent(editorRef.current.innerHTML);
    setArticleForm(prev => ({
      ...prev,
      content: editorRef.current.innerHTML
    }));
  };

  const insertImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        try {
          setLoading(true);
          const response = await api.media.upload(file);
          const imageUrl = response.url;
          
          if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertImage', false, imageUrl);
            setEditorContent(editorRef.current.innerHTML);
            setArticleForm(prev => ({
              ...prev,
              content: editorRef.current.innerHTML
            }));
          }
        } catch (err) {
          setError('ไม่สามารถอัพโหลดรูปภาพได้: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    };
    input.click();
  };

  const insertLink = () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      setSelectedText(selection.toString());
      setLinkText(selection.toString());
    }
    setShowLinkModal(true);
  };

  const applyLink = () => {
    if (!linkUrl) return;
    
    if (selectedText) {
      formatText('createLink', linkUrl);
    } else {
      const linkHtml = `<a href="${linkUrl}" target="_blank">${linkText || linkUrl}</a>`;
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertHTML', false, linkHtml);
        setEditorContent(editorRef.current.innerHTML);
        setArticleForm(prev => ({
          ...prev,
          content: editorRef.current.innerHTML
        }));
      }
    }
    
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
    setSelectedText('');
  };

  const insertTable = () => {
    const tableHtml = `
      <table border="1" style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
        <tr>
          <th style="padding: 8px; background-color: #f5f5f5;">หัวตาราง 1</th>
          <th style="padding: 8px; background-color: #f5f5f5;">หัวตาราง 2</th>
        </tr>
        <tr>
          <td style="padding: 8px;">ข้อมูล 1</td>
          <td style="padding: 8px;">ข้อมูล 2</td>
        </tr>
      </table>
    `;
    
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertHTML', false, tableHtml);
      setEditorContent(editorRef.current.innerHTML);
      setArticleForm(prev => ({
        ...prev,
        content: editorRef.current.innerHTML
      }));
    }
  };

  const onEditorInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setEditorContent(content);
      setArticleForm(prev => ({
        ...prev,
        content: content
      }));
    }
  };

  // Category management functions
  const generateSlug = (name) => {
    return name.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/[\s_-]+/g, '-')
              .replace(/^-+|-+$/g, '');
  };

  const handleCategoryCreate = () => {
    setCategoryForm({
      name: '',
      description: '',
      slug: '',
      color: '#232956'
    });
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleCategoryEdit = (category) => {
    setCategoryForm({
      name: category.name,
      description: category.description,
      slug: category.slug,
      color: category.color
    });
    setEditingCategory(category);
    setShowCategoryModal(true);
  };

  const handleCategoryDelete = async (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.articlesCount > 0) {
      if (!window.confirm(`หมวดหมู่ "${category.name}" มีบทความ ${category.articlesCount} บทความ คุณต้องการลบหรือไม่?`)) {
        return;
      }
    }
    
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่นี้?')) {
      try {
        setLoading(true);
        await api.categories.delete(categoryId);
        await fetchCategories();
        setError(null);
      } catch (err) {
        setError('ไม่สามารถลบหมวดหมู่ได้: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCategorySave = async () => {
    if (!categoryForm.name.trim()) {
      alert('กรุณาใส่ชื่อหมวดหมู่');
      return;
    }

    const slug = categoryForm.slug || generateSlug(categoryForm.name);
    
    // Check for duplicate slug
    const existingCategory = categories.find(c => 
      c.slug === slug && c.id !== editingCategory?.id
    );
    
    if (existingCategory) {
      alert('Slug นี้มีอยู่แล้ว กรุณาใช้ Slug อื่น');
      return;
    }

    try {
      setLoading(true);
      const categoryData = {
        name: categoryForm.name,
        description: categoryForm.description,
        slug: slug,
        color: categoryForm.color
      };

      if (editingCategory) {
        await api.categories.update(editingCategory.id, categoryData);
      } else {
        await api.categories.create(categoryData);
      }

      await fetchCategories();
      setShowCategoryModal(false);
      setError(null);
    } catch (err) {
      setError(`ไม่สามารถ${editingCategory ? 'อัพเดต' : 'สร้าง'}หมวดหมู่ได้: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategoryStatus = async (categoryId) => {
    try {
      const category = categories.find(c => c.id === categoryId);
      if (!category) return;
      
      setLoading(true);
      await api.categories.update(categoryId, {
        ...category,
        isActive: !category.isActive
      });
      await fetchCategories();
      setError(null);
    } catch (err) {
      setError('ไม่สามารถเปลี่ยนสถานะหมวดหมู่ได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetArticleForm = () => {
    setArticleForm({
      title: '',
      excerpt: '',
      content: '',
      category: '',
      categoryId: null,
      tags: [],
      status: 'draft',
      thumbnail: null,
      publishDate: '',
      author: 'Admin'
    });
    setEditorContent('');
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const handleCreateArticle = () => {
    resetArticleForm();
    setEditingArticle(null);
    setCurrentView('create');
  };

  const handleEditArticle = async (article) => {
    try {
      setLoading(true);
      const fullArticle = await api.articles.getById(article.id);
      
      setArticleForm({
        title: fullArticle.title,
        excerpt: fullArticle.excerpt,
        content: fullArticle.content || '',
        category: fullArticle.category,
        categoryId: fullArticle.categoryId,
        tags: fullArticle.tags || [],
        status: fullArticle.status,
        thumbnail: fullArticle.thumbnail,
        publishDate: fullArticle.publishDate || '',
        author: fullArticle.author
      });
      
      setEditorContent(fullArticle.content || '');
      if (editorRef.current) {
        editorRef.current.innerHTML = fullArticle.content || '';
      }
      
      setEditingArticle(fullArticle);
      setCurrentView('edit');
      setError(null);
    } catch (err) {
      setError('ไม่สามารถโหลดบทความได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingArticle(null);
    resetArticleForm();
  };

  const handleFormChange = (field, value) => {
    setArticleForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTagAdd = (tagText) => {
    if (tagText.trim() && !articleForm.tags.includes(tagText.trim())) {
      setArticleForm(prev => ({
        ...prev,
        tags: [...prev.tags, tagText.trim()]
      }));
    }
  };

  const handleTagRemove = (tagToRemove) => {
    setArticleForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        setLoading(true);
        const response = await api.media.upload(file);
        setArticleForm(prev => ({
          ...prev,
          thumbnail: response.url
        }));
        setError(null);
      } catch (err) {
        setError('ไม่สามารถอัพโหลดรูปภาพได้: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async (status = 'draft') => {
    if (!articleForm.title.trim()) {
      alert('กรุณาใส่หัวข้อบทความ');
      return;
    }

    try {
      setLoading(true);
      const articleData = {
        ...articleForm,
        status,
        publishDate: status === 'published' ? new Date().toISOString().split('T')[0] : articleForm.publishDate
      };

      if (editingArticle) {
        await api.articles.update(editingArticle.id, articleData);
      } else {
        await api.articles.create(articleData);
      }

      await fetchArticles();
      await fetchStats();
      alert(`บทความ${status === 'published' ? 'เผยแพร่' : 'บันทึก'}เรียบร้อยแล้ว`);
      handleBackToList();
      setError(null);
    } catch (err) {
      setError(`ไม่สามารถ${status === 'published' ? 'เผยแพร่' : 'บันทึก'}บทความได้: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบบทความนี้?')) {
      try {
        setLoading(true);
        await api.articles.delete(articleId);
        await fetchArticles();
        await fetchStats();
        setError(null);
      } catch (err) {
        setError('ไม่สามารถลบบทความได้: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return '#28a745';
      case 'draft':
        return '#ffc107';
      case 'archived':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'published':
        return 'เผยแพร่แล้ว';
      case 'draft':
        return 'แบบร่าง';
      case 'archived':
        return 'เก็บในคลัง';
      default:
        return status;
    }
  };

  // Rich Text Editor Toolbar Component
  const RichTextToolbar = () => (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '0.25rem',
      padding: '0.75rem',
      backgroundColor: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderBottom: 'none',
      borderRadius: '0.5rem 0.5rem 0 0'
    }}>
      {/* Text Formatting */}
      <div style={{ display: 'flex', gap: '0.25rem', marginRight: '0.5rem' }}>
        <button 
          type="button"
          onClick={() => formatText('bold')}
          title="ตัวหนา"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Bold size={14} />
        </button>
        <button 
          type="button"
          onClick={() => formatText('italic')}
          title="ตัวเอียง"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Italic size={14} />
        </button>
        <button 
          type="button"
          onClick={() => formatText('underline')}
          title="ขีดเส้นใต้"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Underline size={14} />
        </button>
      </div>

      {/* Headings */}
      <div style={{ display: 'flex', gap: '0.25rem', marginRight: '0.5rem' }}>
        <button 
          type="button"
          onClick={() => formatText('formatBlock', 'h1')}
          title="หัวข้อใหญ่"
          style={{
            padding: '0.375rem 0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          H1
        </button>
        <button 
          type="button"
          onClick={() => formatText('formatBlock', 'h2')}
          title="หัวข้อกลาง"
          style={{
            padding: '0.375rem 0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          H2
        </button>
        <button 
          type="button"
          onClick={() => formatText('formatBlock', 'h3')}
          title="หัวข้อเล็ก"
          style={{
            padding: '0.375rem 0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}
        >
          H3
        </button>
      </div>

      {/* Alignment */}
      <div style={{ display: 'flex', gap: '0.25rem', marginRight: '0.5rem' }}>
        <button 
          type="button"
          onClick={() => formatText('justifyLeft')}
          title="จัดซ้าย"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <AlignLeft size={14} />
        </button>
        <button 
          type="button"
          onClick={() => formatText('justifyCenter')}
          title="จัดกึ่งกลาง"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <AlignCenter size={14} />
        </button>
        <button 
          type="button"
          onClick={() => formatText('justifyRight')}
          title="จัดขวา"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <AlignRight size={14} />
        </button>
      </div>

      {/* Lists */}
      <div style={{ display: 'flex', gap: '0.25rem', marginRight: '0.5rem' }}>
        <button 
          type="button"
          onClick={() => formatText('insertUnorderedList')}
          title="รายการแบบไม่เรียงลำดับ"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <List size={14} />
        </button>
        <button 
          type="button"
          onClick={() => formatText('insertOrderedList')}
          title="รายการแบบเรียงลำดับ"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ListOrdered size={14} />
        </button>
      </div>

      {/* Insert Elements */}
      <div style={{ display: 'flex', gap: '0.25rem', marginRight: '0.5rem' }}>
        <button 
          type="button"
          onClick={insertLink}
          title="แทรกลิงก์"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <LinkIcon size={14} />
        </button>
        <button 
          type="button"
          onClick={insertImage}
          title="แทรกรูปภาพ"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ImageIcon size={14} />
        </button>
        <button 
          type="button"
          onClick={insertTable}
          title="แทรกตาราง"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Table size={14} />
        </button>
      </div>

      {/* Other Tools */}
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button 
          type="button"
          onClick={() => formatText('formatBlock', 'blockquote')}
          title="ข้อความยกมา"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Quote size={14} />
        </button>
        <button 
          type="button"
          onClick={() => formatText('formatBlock', 'pre')}
          title="โค้ด"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Code size={14} />
        </button>
        <button 
          type="button"
          onClick={() => formatText('undo')}
          title="ยกเลิก"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Undo size={14} />
        </button>
        <button 
          type="button"
          onClick={() => formatText('redo')}
          title="ทำซ้ำ"
          style={{
            padding: '0.375rem',
            backgroundColor: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: '0.25rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <Redo size={14} />
        </button>
      </div>
    </div>
  );

  // Link Modal Component
  const LinkModal = () => {
    if (!showLinkModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '2rem',
          width: '90%',
          maxWidth: '500px'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '1.5rem'
          }}>
            เพิ่มลิงก์
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              URL
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'var(--text-primary)',
              marginBottom: '0.5rem'
            }}>
              ข้อความที่แสดง
            </label>
            <input
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              placeholder="ข้อความที่จะแสดงเป็นลิงก์"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem'
          }}>
            <button
              onClick={() => {
                setShowLinkModal(false);
                setLinkUrl('');
                setLinkText('');
                setSelectedText('');
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              ยกเลิก
            </button>
            <button
              onClick={applyLink}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#df2528',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              เพิ่มลิงก์
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoryModal = () => {
    if (!showCategoryModal) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          padding: '2rem',
          width: '90%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)',
              margin: 0 
            }}>
              {editingCategory ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่ใหม่'}
            </h2>
            <button
              onClick={() => setShowCategoryModal(false)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '0.5rem'
              }}
            >
              <X size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Category Name */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                ชื่อหมวดหมู่ *
              </label>
              <input
                type="text"
                value={categoryForm.name}
                onChange={(e) => {
                  setCategoryForm(prev => ({
                    ...prev,
                    name: e.target.value,
                    slug: prev.slug || generateSlug(e.target.value)
                  }));
                }}
                placeholder="ใส่ชื่อหมวดหมู่..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            {/* Category Description */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                คำอธิบาย
              </label>
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="คำอธิบายเกี่ยวกับหมวดหมู่นี้..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Category Slug */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Slug (URL)
              </label>
              <input
                type="text"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="category-slug"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                ใช้สำหรับ URL เช่น /category/category-slug
              </small>
            </div>

            {/* Category Color */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                สีของหมวดหมู่
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  style={{
                    width: '50px',
                    height: '40px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.25rem',
                    cursor: 'pointer'
                  }}
                />
                <input
                  type="text"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#232956"
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '2rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)'
          }}>
            <button
              onClick={() => setShowCategoryModal(false)}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              ยกเลิก
            </button>
            <button
              onClick={handleCategorySave}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#df2528',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              {editingCategory ? 'อัพเดต' : 'สร้าง'}หมวดหมู่
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCategoriesManagement = () => (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <h1 style={{ 
            fontSize: '1.75rem', 
            fontWeight: '700', 
            color: 'var(--text-primary)', 
            marginBottom: '0.5rem' 
          }}>
            จัดการหมวดหมู่
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            เพิ่ม แก้ไข และจัดการหมวดหมู่บทความ
          </p>
        </div>
        <button 
          onClick={handleCategoryCreate}
          disabled={loading}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#df2528',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {loading ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
          เพิ่มหมวดหมู่ใหม่
        </button>
      </div>

      {/* Loading state */}
      {categoriesLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem',
          color: 'var(--text-muted)'
        }}>
          <Loader size={24} className="animate-spin" style={{ marginRight: '0.5rem' }} />
          กำลังโหลดหมวดหมู่...
        </div>
      )}

      {/* Categories Grid */}
      {!categoriesLoading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {categories.map((category) => (
            <div key={category.id} style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              position: 'relative'
            }}>
              {/* Status Badge */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                gap: '0.5rem'
              }}>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  backgroundColor: category.isActive ? '#28a74520' : '#6c757d20',
                  color: category.isActive ? '#28a745' : '#6c757d',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {category.isActive ? 'ใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </div>

              {/* Category Header */}
              <div style={{ marginBottom: '1rem', paddingRight: '4rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem'
                }}>
                  <div style={{
                    width: '1rem',
                    height: '1rem',
                    backgroundColor: category.color,
                    borderRadius: '50%'
                  }} />
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    {category.name}
                  </h3>
                </div>
                
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '0.5rem',
                  lineHeight: '1.4'
                }}>
                  {category.description}
                </p>
                
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  Slug: /{category.slug}
                </div>
              </div>

              {/* Stats */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                padding: '1rem',
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '0.5rem'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: '700', 
                    color: 'var(--text-primary)' 
                  }}>
                    {category.articlesCount || 0}
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)' 
                  }}>
                    บทความ
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: '600', 
                    color: 'var(--text-secondary)' 
                  }}>
                    สร้างเมื่อ
                  </div>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-muted)' 
                  }}>
                    {category.createdAt}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                display: 'flex',
                gap: '0.5rem'
              }}>
                <button
                  onClick={() => toggleCategoryStatus(category.id)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: 'transparent',
                    color: category.isActive ? '#ffc107' : '#28a745',
                    border: `1px solid ${category.isActive ? '#ffc107' : '#28a745'}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {category.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                </button>
                <button
                  onClick={() => handleCategoryEdit(category)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    backgroundColor: '#17a2b8',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <Edit3 size={14} />
                  แก้ไข
                </button>
                <button
                  onClick={() => handleCategoryDelete(category.id)}
                  disabled={loading}
                  style={{
                    padding: '0.5rem',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!categoriesLoading && categories.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <Folder size={48} style={{ 
            color: 'var(--text-muted)', 
            marginBottom: '1rem' 
          }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            ยังไม่มีหมวดหมู่
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem'
          }}>
            เริ่มต้นโดยการสร้างหมวดหมู่แรกของคุณ
          </p>
          <button 
            onClick={handleCategoryCreate}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#df2528',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={16} />
            เพิ่มหมวดหมู่ใหม่
          </button>
        </div>
      )}
    </div>
  );

  const renderTabNavigation = () => (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      marginBottom: '2rem',
      borderBottom: '1px solid var(--border-color)',
      paddingBottom: '1rem'
    }}>
      <button
        onClick={() => setCurrentView('list')}
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: currentView === 'list' ? '#df2528' : 'transparent',
          color: currentView === 'list' ? 'white' : 'var(--text-secondary)',
          border: currentView === 'list' ? 'none' : '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <FileText size={16} />
        บทความทั้งหมด
      </button>
      <button
        onClick={() => setCurrentView('categories')}
        style={{
          padding: '0.75rem 1rem',
          backgroundColor: currentView === 'categories' ? '#df2528' : 'transparent',
          color: currentView === 'categories' ? 'white' : 'var(--text-secondary)',
          border: currentView === 'categories' ? 'none' : '1px solid var(--border-color)',
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <Folder size={16} />
        หมวดหมู่
        <span style={{
          padding: '0.125rem 0.5rem',
          backgroundColor: currentView === 'categories' ? 'rgba(255,255,255,0.2)' : '#df252820',
          color: currentView === 'categories' ? 'white' : '#df2528',
          borderRadius: '1rem',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          {categories.length}
        </span>
      </button>
    </div>
  );

  const renderArticleEditor = () => {
    return (
      <div>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleBackToList}
              style={{
                padding: '0.5rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ 
                fontSize: '1.75rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                marginBottom: '0.25rem' 
              }}>
                {editingArticle ? 'แก้ไขบทความ' : 'เขียนบทความใหม่'}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {editingArticle ? 'แก้ไขเนื้อหาบทความ' : 'สร้างบทความใหม่สำหรับเว็บไซต์'}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setPreviewMode(!previewMode)}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-secondary)'
              }}
            >
              <Eye size={16} />
              {previewMode ? 'แก้ไข' : 'ดูตัวอย่าง'}
            </button>
            <button
              onClick={() => handleSave('draft')}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                border: '1px solid #ffc107',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#ffc107'
              }}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
              บันทึกแบบร่าง
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={loading}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#df2528',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              เผยแพร่
            </button>
          </div>
        </div>

        {previewMode ? (
          // Preview Mode
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            borderRadius: '0.75rem',
            border: '1px solid var(--border-color)',
            padding: '2rem'
          }}>
            <div style={{
              maxWidth: '800px',
              margin: '0 auto'
            }}>
              {/* Article Header */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1rem'
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#232956',
                    color: 'white',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {articleForm.category || 'ไม่ระบุหมวดหมู่'}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)'
                  }}>
                    โดย {articleForm.author}
                  </span>
                </div>
                
                <h1 style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  lineHeight: '1.2'
                }}>
                  {articleForm.title || 'ไม่มีหัวข้อ'}
                </h1>
                
                <p style={{
                  fontSize: '1.125rem',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                  marginBottom: '1.5rem'
                }}>
                  {articleForm.excerpt || 'ไม่มีคำอธิบายย่อ'}
                </p>

                {/* Tags */}
                {articleForm.tags.length > 0 && (
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    marginBottom: '2rem'
                  }}>
                    {articleForm.tags.map((tag, index) => (
                      <span key={index} style={{
                        padding: '0.25rem 0.75rem',
                        backgroundColor: '#df252820',
                        color: '#df2528',
                        borderRadius: '1rem',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Thumbnail */}
                {articleForm.thumbnail && (
                  <div style={{
                    width: '100%',
                    height: '400px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '0.5rem',
                    marginBottom: '2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--text-muted)',
                    backgroundImage: `url(${articleForm.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    {!articleForm.thumbnail && <Image size={48} />}
                  </div>
                )}
              </div>

              {/* Article Content */}
              <div style={{
                fontSize: '1rem',
                lineHeight: '1.8',
                color: 'var(--text-primary)'
              }}>
                {articleForm.content ? (
                  <div dangerouslySetInnerHTML={{
                    __html: articleForm.content
                  }} />
                ) : (
                  <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    ไม่มีเนื้อหา
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Edit Mode
          <div style={{
            display: 'grid',
            gridTemplateColumns: windowWidth <= 768 ? '1fr' : '2fr 1fr',
            gap: '2rem'
          }}>
            {/* Main Content */}
            <div style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              padding: '2rem'
            }}>
              {/* Title */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  หัวข้อบทความ *
                </label>
                <input
                  type="text"
                  value={articleForm.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="ใส่หัวข้อบทความ..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                />
              </div>

              {/* Excerpt */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  คำอธิบายย่อ
                </label>
                <textarea
                  value={articleForm.excerpt}
                  onChange={(e) => handleFormChange('excerpt', e.target.value)}
                  placeholder="คำอธิบายย่อของบทความ..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Rich Text Editor */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  เนื้อหาบทความ *
                </label>
                
                {/* Rich Text Editor Toolbar */}
                <RichTextToolbar />
                
                {/* Rich Text Editor Content */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={onEditorInput}
                  style={{
                    minHeight: '400px',
                    padding: '1rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0 0 0.5rem 0.5rem',
                    fontSize: '0.875rem',
                    lineHeight: '1.6',
                    outline: 'none',
                    backgroundColor: 'white'
                  }}
                  placeholder="เขียนเนื้อหาบทความของคุณที่นี่..."
                />
              </div>

              {/* Thumbnail Upload */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem'
                }}>
                  รูปปกบทความ
                </label>
                
                {articleForm.thumbnail ? (
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '200px',
                    backgroundColor: 'var(--border-color)',
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    backgroundImage: `url(${articleForm.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    <button
                      onClick={() => handleFormChange('thumbnail', null)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        padding: '0.25rem',
                        backgroundColor: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.25rem',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '200px',
                    border: '2px dashed var(--border-color)',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: 'var(--text-muted)'
                  }}>
                    {loading ? (
                      <>
                        <Loader size={48} className="animate-spin" style={{ marginBottom: '0.5rem' }} />
                        <span>กำลังอัพโหลด...</span>
                      </>
                    ) : (
                      <>
                        <Upload size={48} style={{ marginBottom: '0.5rem' }} />
                        <span>คลิกเพื่ออัพโหลดรูปภาพ</span>
                        <span style={{ fontSize: '0.75rem' }}>JPG, PNG หรือ GIF (ขนาดไม่เกิน 5MB)</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                      disabled={loading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Publish Settings */}
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  การเผยแพร่
                </h3>

                {/* Status */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    สถานะ
                  </label>
                  <select
                    value={articleForm.status}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="draft">แบบร่าง</option>
                    <option value="published">เผยแพร่</option>
                    <option value="archived">เก็บในคลัง</option>
                  </select>
                </div>

                {/* Publish Date */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    วันที่เผยแพร่
                  </label>
                  <input
                    type="date"
                    value={articleForm.publishDate}
                    onChange={(e) => handleFormChange('publishDate', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>

                {/* Author */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    marginBottom: '0.5rem'
                  }}>
                    ผู้เขียน
                  </label>
                  <input
                    type="text"
                    value={articleForm.author}
                    onChange={(e) => handleFormChange('author', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
              </div>

              {/* Category */}
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h3 style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: 'var(--text-primary)',
                    margin: 0
                  }}>
                    หมวดหมู่
                  </h3>
                  <button
                    onClick={() => setCurrentView('categories')}
                    style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <Settings size={16} />
                  </button>
                </div>
                <select
                  value={articleForm.categoryId || ''}
                  onChange={(e) => {
                    const selectedCategory = categories.find(cat => cat.id === parseInt(e.target.value));
                    handleFormChange('categoryId', parseInt(e.target.value) || null);
                    handleFormChange('category', selectedCategory?.name || '');
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-color)',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}
                >
                  <option value="">เลือกหมวดหมู่</option>
                  {categories
                    .filter(cat => cat.isActive)
                    .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags */}
              <div style={{
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '0.75rem',
                border: '1px solid var(--border-color)',
                padding: '1.5rem'
              }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '1rem'
                }}>
                  แท็ก
                </h3>
                
                {/* Add Tag Input */}
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd(newTag);
                        setNewTag('');
                      }
                    }}
                    placeholder="เพิ่มแท็ก..."
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <button
                    onClick={() => {
                      handleTagAdd(newTag);
                      setNewTag('');
                    }}
                    style={{
                      padding: '0.5rem',
                      backgroundColor: '#232956',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Tags List */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  {articleForm.tags.map((tag, index) => (
                    <span
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#df252820',
                        color: '#df2528',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}
                    >
                      #{tag}
                      <button
                        onClick={() => handleTagRemove(tag)}
                        style={{
                          backgroundColor: 'transparent',
                          border: 'none',
                          color: '#df2528',
                          cursor: 'pointer',
                          padding: '0',
                          marginLeft: '0.25rem'
                        }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderArticlesList = () => (
    <div>
      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#f8d7da',
          color: '#721c24',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          border: '1px solid #f5c6cb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            {error}
          </div>
          <button
            onClick={() => setError(null)}
            style={{
              marginTop: '0.5rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: 'transparent',
              color: '#721c24',
              border: '1px solid #721c24',
              borderRadius: '0.25rem',
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            ปิด
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <FileText size={20} color="#df2528" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>บทความทั้งหมด</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.total}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} color="#28a745" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>เผยแพร่แล้ว</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.published}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <AlertCircle size={20} color="#ffc107" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>แบบร่าง</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.draft}
          </div>
        </div>

        <div style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Eye size={20} color="#17a2b8" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>การเข้าชมรวม</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>
            {stats.totalViews.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{
        display: 'flex',
        flexDirection: windowWidth <= 768 ? 'column' : 'row',
        gap: '1rem',
        marginBottom: '1.5rem',
        alignItems: windowWidth <= 768 ? 'stretch' : 'center'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{
            position: 'absolute',
            left: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)'
          }} />
          <input
            type="text"
            placeholder="ค้นหาบทความ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem 0.75rem 0.75rem 2.5rem',
              border: '1px solid var(--border-color)',
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '0.75rem',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            minWidth: '120px'
          }}
        >
          <option value="all">สถานะทั้งหมด</option>
          <option value="published">เผยแพร่แล้ว</option>
          <option value="draft">แบบร่าง</option>
          <option value="archived">เก็บในคลัง</option>
        </select>
        <button 
          onClick={handleCreateArticle}
          disabled={loading}
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: '#df2528',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Plus size={16} />
          เขียนบทความใหม่
        </button>
        <button
          onClick={() => fetchArticles()}
          disabled={loading || articlesLoading}
          style={{
            padding: '0.75rem',
            backgroundColor: 'transparent',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <RefreshCw size={16} className={articlesLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Loading state */}
      {articlesLoading && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '3rem',
          color: 'var(--text-muted)'
        }}>
          <Loader size={24} className="animate-spin" style={{ marginRight: '0.5rem' }} />
          กำลังโหลดบทความ...
        </div>
      )}

      {/* Articles Grid */}
      {!articlesLoading && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: windowWidth <= 768 ? '1fr' : 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '1.5rem'
        }}>
          {articles.map((article) => (
            <div key={article.id} style={{
              backgroundColor: 'var(--bg-primary)',
              borderRadius: '0.75rem',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              {/* Article Image */}
              <div style={{
                height: '200px',
                backgroundColor: 'var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-muted)',
                backgroundImage: article.thumbnail ? `url(${article.thumbnail})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                {!article.thumbnail && <Image size={48} />}
              </div>
              
              {/* Article Content */}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem' 
                }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: `${getStatusColor(article.status)}20`,
                    color: getStatusColor(article.status),
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {getStatusText(article.status)}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button style={{
                      padding: '0.25rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer'
                    }}>
                      <Eye size={16} />
                    </button>
                    <button 
                      onClick={() => handleEditArticle(article)}
                      disabled={loading}
                      style={{
                        padding: '0.25rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteArticle(article.id)}
                      disabled={loading}
                      style={{
                        padding: '0.25rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: '#dc3545',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  marginBottom: '0.5rem',
                  lineHeight: '1.4'
                }}>
                  {article.title}
                </h3>
                
                <p style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1rem',
                  lineHeight: '1.5'
                }}>
                  {article.excerpt}
                </p>
                
                {/* Tags */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '0.5rem', 
                  marginBottom: '1rem' 
                }}>
                  {(article.tags || []).map((tag, index) => (
                    <span key={index} style={{
                      padding: '0.25rem 0.5rem',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-secondary)',
                      borderRadius: '0.25rem',
                      fontSize: '0.75rem'
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
                
                {/* Meta Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <User size={12} />
                    {article.author}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Eye size={12} />
                    {(article.views || 0).toLocaleString()} ครั้ง
                  </div>
                  {article.publishDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Clock size={12} />
                      {article.publishDate}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!articlesLoading && articles.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border-color)'
        }}>
          <FileText size={48} style={{ 
            color: 'var(--text-muted)', 
            marginBottom: '1rem' 
          }} />
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            {searchTerm || statusFilter !== 'all' ? 'ไม่พบบทความที่ตรงกับการค้นหา' : 'ยังไม่มีบทความ'}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.5rem'
          }}>
            {searchTerm || statusFilter !== 'all' 
              ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูผลลัพธ์อื่น' 
              : 'เริ่มต้นโดยการสร้างบทความแรกของคุณ'
            }
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <button 
              onClick={handleCreateArticle}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#df2528',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <Plus size={16} />
              เขียนบทความใหม่
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: 'var(--bg-secondary)',
      minHeight: '100vh',
      padding: '2rem'
    }}>
      {(currentView === 'list' || currentView === 'categories') && (
        <>
          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ 
              fontSize: '1.75rem', 
              fontWeight: '700', 
              color: 'var(--text-primary)', 
              marginBottom: '0.5rem' 
            }}>
              ข่าวสารและบทความ
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              จัดการข่าวสาร บทความ และเนื้อหาต่างๆ ในเว็บไซต์
            </p>
          </div>

          {renderTabNavigation()}
        </>
      )}

      {currentView === 'list' ? (
        renderArticlesList()
      ) : currentView === 'categories' ? (
        renderCategoriesManagement()
      ) : (
        renderArticleEditor()
      )}

      {/* Modals */}
      {renderCategoryModal()}
      <LinkModal />
    </div>
  );
};

export default ContentManagement;