// controllers/searchController.js
const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Package = require('../models/Package');
const Article = require('../models/Article');
const Event = require('../models/Event');
const Gym = require('../models/Gym');

class SearchController {
  // Global search
  async globalSearch(req, res) {
    try {
      const { q, type, limit = 10 } = req.query;

      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุคำค้นหาอย่างน้อย 2 ตัวอักษร'
        });
      }

      let results = {};

      // If type is specified, search only that type
      if (type) {
        switch (type) {
          case 'trainers':
            results.trainers = await this.searchTrainers(q, limit);
            break;
          case 'articles':
            results.articles = await this.searchArticles(q, limit);
            break;
          case 'events':
            results.events = await this.searchEvents(q, limit);
            break;
          case 'gyms':
            results.gyms = await this.searchGyms(q, limit);
            break;
          default:
            return res.status(400).json({
              success: false,
              message: 'ประเภทการค้นหาไม่ถูกต้อง'
            });
        }
      } else {
        // Search all types with limited results
        const searchLimit = Math.ceil(limit / 4);
        
        const [trainers, articles, events, gyms] = await Promise.all([
          this.searchTrainers(q, searchLimit),
          this.searchArticles(q, searchLimit),
          this.searchEvents(q, searchLimit),
          this.searchGyms(q, searchLimit)
        ]);

        results = {
          trainers,
          articles,
          events,
          gyms
        };
      }

      // Calculate total results
      const totalResults = Object.values(results).reduce((sum, category) => 
        sum + (category?.results?.length || 0), 0
      );

      res.json({
        success: true,
        data: {
          query: q,
          totalResults,
          results
        }
      });

    } catch (error) {
      console.error('Global search error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการค้นหา'
      });
    }
  }

  // Search trainers
  async searchTrainers(query, limit) {
    try {
      // Find users who are trainers
      const users = await User.find({
        role: 'trainer',
        isActive: true,
        $or: [
          { firstName: { $regex: query, $options: 'i' } },
          { lastName: { $regex: query, $options: 'i' } }
        ]
      })
      .select('_id firstName lastName profilePicture')
      .limit(limit);

      const userIds = users.map(u => u._id);

      // Get trainer profiles
      const trainers = await Trainer.find({
        $or: [
          { userId: { $in: userIds } },
          { bio: { $regex: query, $options: 'i' } },
          { specializations: { $regex: query, $options: 'i' } }
        ]
      })
      .populate('userId', 'firstName lastName profilePicture')
      .select('userId rating specializations experience bio')
      .limit(limit);

      // Get unique trainers
      const uniqueTrainers = trainers.reduce((acc, trainer) => {
        if (!acc.find(t => t._id.toString() === trainer._id.toString())) {
          acc.push(trainer);
        }
        return acc;
      }, []);

      return {
        type: 'trainers',
        count: uniqueTrainers.length,
        results: uniqueTrainers.map(trainer => ({
          id: trainer._id,
          name: `${trainer.userId.firstName} ${trainer.userId.lastName}`,
          profilePicture: trainer.userId.profilePicture,
          rating: trainer.rating,
          specializations: trainer.specializations,
          experience: trainer.experience,
          snippet: trainer.bio ? trainer.bio.substring(0, 150) + '...' : null
        }))
      };

    } catch (error) {
      console.error('Search trainers error:', error);
      return { type: 'trainers', count: 0, results: [] };
    }
  }

  // Search articles
  async searchArticles(query, limit) {
    try {
      const articles = await Article.find({
        status: 'published',
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { content: { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      })
      .select('title slug excerpt coverImage publishDate category viewCount')
      .sort({ score: { $meta: 'textScore' }, publishDate: -1 })
      .limit(limit);

      return {
        type: 'articles',
        count: articles.length,
        results: articles.map(article => ({
          id: article._id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          coverImage: article.coverImage,
          category: article.category,
          publishDate: article.publishDate,
          viewCount: article.viewCount
        }))
      };

    } catch (error) {
      console.error('Search articles error:', error);
      return { type: 'articles', count: 0, results: [] };
    }
  }

  // Search events
  async searchEvents(query, limit) {
    try {
      const events = await Event.find({
        status: { $ne: 'cancelled' },
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'location.venue': { $regex: query, $options: 'i' } },
          { tags: { $regex: query, $options: 'i' } }
        ]
      })
      .select('title slug description startDate endDate location coverImage type')
      .sort({ startDate: 1 })
      .limit(limit);

      return {
        type: 'events',
        count: events.length,
        results: events.map(event => ({
          id: event._id,
          title: event.title,
          slug: event.slug,
          description: event.description.substring(0, 150) + '...',
          startDate: event.startDate,
          endDate: event.endDate,
          location: event.location,
          coverImage: event.coverImage,
          type: event.type
        }))
      };

    } catch (error) {
      console.error('Search events error:', error);
      return { type: 'events', count: 0, results: [] };
    }
  }

  // Search gyms
  async searchGyms(query, limit) {
    try {
      const gyms = await Gym.find({
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { 'address.district': { $regex: query, $options: 'i' } },
          { 'address.province': { $regex: query, $options: 'i' } },
          { amenities: { $regex: query, $options: 'i' } }
        ]
      })
      .select('name images address type amenities rating')
      .limit(limit);

      return {
        type: 'gyms',
        count: gyms.length,
        results: gyms.map(gym => ({
          id: gym._id,
          name: gym.name,
          images: gym.images,
          address: gym.address,
          type: gym.type,
          amenities: gym.amenities.slice(0, 5),
          rating: gym.rating
        }))
      };

    } catch (error) {
      console.error('Search gyms error:', error);
      return { type: 'gyms', count: 0, results: [] };
    }
  }

  // Search suggestions (autocomplete)
  async getSearchSuggestions(req, res) {
    try {
      const { q, type = 'all' } = req.query;

      if (!q || q.length < 2) {
        return res.json({
          success: true,
          data: []
        });
      }

      let suggestions = [];

      if (type === 'all' || type === 'trainers') {
        // Get trainer name suggestions
        const trainers = await User.find({
          role: 'trainer',
          isActive: true,
          $or: [
            { firstName: { $regex: `^${q}`, $options: 'i' } },
            { lastName: { $regex: `^${q}`, $options: 'i' } }
          ]
        })
        .select('firstName lastName')
        .limit(5);

        trainers.forEach(trainer => {
          suggestions.push({
            type: 'trainer',
            text: `${trainer.firstName} ${trainer.lastName}`,
            value: `${trainer.firstName} ${trainer.lastName}`
          });
        });
      }

      if (type === 'all' || type === 'specializations') {
        // Get specialization suggestions
        const specializations = await Trainer.distinct('specializations', {
          specializations: { $regex: `^${q}`, $options: 'i' }
        });

        specializations.slice(0, 5).forEach(spec => {
          suggestions.push({
            type: 'specialization',
            text: spec,
            value: spec
          });
        });
      }

      if (type === 'all' || type === 'locations') {
        // Get location suggestions
        const locations = await Gym.aggregate([
          {
            $match: {
              $or: [
                { 'address.district': { $regex: `^${q}`, $options: 'i' } },
                { 'address.province': { $regex: `^${q}`, $options: 'i' } }
              ]
            }
          },
          {
            $group: {
              _id: '$address.district',
              province: { $first: '$address.province' }
            }
          },
          { $limit: 5 }
        ]);

        locations.forEach(loc => {
          suggestions.push({
            type: 'location',
            text: `${loc._id}, ${loc.province}`,
            value: loc._id
          });
        });
      }

      res.json({
        success: true,
        data: suggestions
      });

    } catch (error) {
      console.error('Get search suggestions error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงคำแนะนำ'
      });
    }
  }

  // Advanced trainer search
  async advancedTrainerSearch(req, res) {
    try {
      const {
        name,
        specializations,
        minRating,
        maxPrice,
        minPrice,
        location,
        radius,
        experience,
        gender,
        languages,
        availability,
        sortBy = 'rating',
        order = 'desc',
        page = 1,
        limit = 12
      } = req.query;

      // Build user query
      let userQuery = { role: 'trainer', isActive: true };
      
      if (name) {
        userQuery.$or = [
          { firstName: { $regex: name, $options: 'i' } },
          { lastName: { $regex: name, $options: 'i' } }
        ];
      }

      if (gender) {
        userQuery.gender = gender;
      }

      // Get matching users
      const users = await User.find(userQuery).select('_id');
      const userIds = users.map(u => u._id);

      // Build trainer query
      let trainerQuery = { userId: { $in: userIds } };

      if (specializations) {
        const specArray = Array.isArray(specializations) ? specializations : [specializations];
        trainerQuery.specializations = { $in: specArray };
      }

      if (minRating) {
        trainerQuery.rating = { $gte: parseFloat(minRating) };
      }

      if (experience) {
        trainerQuery.experience = { $gte: parseInt(experience) };
      }

      if (languages) {
        const langArray = Array.isArray(languages) ? languages : [languages];
        trainerQuery.languages = { $in: langArray };
      }

      // Execute trainer query
      let trainersQuery = Trainer.find(trainerQuery)
        .populate({
          path: 'userId',
          select: 'firstName lastName profilePicture email phone address'
        })
        .populate({
          path: 'packages',
          match: {
            isActive: true,
            ...(minPrice && { price: { $gte: parseFloat(minPrice) } }),
            ...(maxPrice && { price: { $lte: parseFloat(maxPrice) } })
          },
          options: { limit: 3 }
        });

      // Apply sorting
      const sortOptions = {};
      sortOptions[sortBy] = order === 'desc' ? -1 : 1;
      trainersQuery = trainersQuery.sort(sortOptions);

      // Execute query with pagination
      const trainers = await trainersQuery
        .limit(limit * 1)
        .skip((page - 1) * limit);

      // Filter by package price if needed
      let filteredTrainers = trainers;
      if (minPrice || maxPrice) {
        filteredTrainers = trainers.filter(trainer => 
          trainer.packages && trainer.packages.length > 0
        );
      }

      // Location-based filtering (if implemented)
      if (location && radius) {
        // This would require geospatial indexing on trainer addresses
        // For now, filter by district/province text match
        filteredTrainers = filteredTrainers.filter(trainer => {
          const address = trainer.userId.address;
          return address && (
            address.district.includes(location) ||
            address.province.includes(location)
          );
        });
      }

      // Availability filtering
      if (availability) {
        const dayMap = {
          'monday': 0,
          'tuesday': 1,
          'wednesday': 2,
          'thursday': 3,
          'friday': 4,
          'saturday': 5,
          'sunday': 6
        };

        const requestedDays = Array.isArray(availability) ? availability : [availability];
        
        filteredTrainers = filteredTrainers.filter(trainer => {
          if (!trainer.workingHours) return false;
          
          return requestedDays.every(day => {
            const dayIndex = dayMap[day.toLowerCase()];
            const schedule = trainer.workingHours[dayIndex];
            return schedule && schedule.isAvailable;
          });
        });
      }

      const totalCount = filteredTrainers.length;

      res.json({
        success: true,
        data: {
          trainers: filteredTrainers,
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalItems: totalCount,
            itemsPerPage: limit
          },
          filters: {
            name,
            specializations,
            minRating,
            priceRange: { min: minPrice, max: maxPrice },
            location,
            experience,
            gender,
            languages,
            availability
          }
        }
      });

    } catch (error) {
      console.error('Advanced trainer search error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการค้นหาเทรนเนอร์'
      });
    }
  }

  // Search history
  async saveSearchHistory(req, res) {
    try {
      const userId = req.user.userId;
      const { query, type, filters, resultsCount } = req.body;

      // Save search history (simplified - in production use separate model)
      const searchHistory = {
        userId,
        query,
        type,
        filters,
        resultsCount,
        searchedAt: new Date()
      };

      // Could save to database here

      res.json({
        success: true,
        message: 'บันทึกประวัติการค้นหาสำเร็จ'
      });

    } catch (error) {
      console.error('Save search history error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการบันทึกประวัติ'
      });
    }
  }

  // Get popular searches
  async getPopularSearches(req, res) {
    try {
      const { type = 'all', limit = 10 } = req.query;

      // This would aggregate from search history
      // For now, return sample data
      const popularSearches = {
        all: [
          { term: 'โยคะ', count: 245 },
          { term: 'ลดน้ำหนัก', count: 189 },
          { term: 'เพิ่มกล้ามเนื้อ', count: 156 },
          { term: 'มวยไทย', count: 134 },
          { term: 'พิลาทิส', count: 98 }
        ],
        trainers: [
          { term: 'เทรนเนอร์โยคะ', count: 87 },
          { term: 'เทรนเนอร์มวยไทย', count: 65 },
          { term: 'Personal Trainer', count: 54 }
        ],
        locations: [
          { term: 'สุขุมวิท', count: 123 },
          { term: 'สีลม', count: 98 },
          { term: 'ลาดพร้าว', count: 76 }
        ]
      };

      const results = type === 'all' 
        ? popularSearches.all 
        : popularSearches[type] || [];

      res.json({
        success: true,
        data: results.slice(0, limit)
      });

    } catch (error) {
      console.error('Get popular searches error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการค้นหายอดนิยม'
      });
    }
  }

  // Get search filters
  async getSearchFilters(req, res) {
    try {
      const { type } = req.query;

      let filters = {};

      if (type === 'trainers' || !type) {
        // Get available specializations
        const specializations = await Trainer.distinct('specializations');
        
        // Get available languages
        const languages = await Trainer.distinct('languages');
        
        // Get price range
        const priceRange = await Package.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              minPrice: { $min: '$price' },
              maxPrice: { $max: '$price' }
            }
          }
        ]);

        filters.trainers = {
          specializations: specializations.sort(),
          languages: languages.sort(),
          priceRange: priceRange[0] || { minPrice: 0, maxPrice: 10000 },
          experience: [
            { value: 1, label: '1+ ปี' },
            { value: 3, label: '3+ ปี' },
            { value: 5, label: '5+ ปี' },
            { value: 10, label: '10+ ปี' }
          ],
          rating: [
            { value: 4, label: '4+ ดาว' },
            { value: 4.5, label: '4.5+ ดาว' }
          ]
        };
      }

      if (type === 'gyms' || !type) {
        // Get gym types
        const gymTypes = await Gym.distinct('type');
        
        // Get amenities
        const amenities = await Gym.distinct('amenities');

        filters.gyms = {
          types: gymTypes,
          amenities: amenities,
          radius: [
            { value: 1, label: '1 กม.' },
            { value: 3, label: '3 กม.' },
            { value: 5, label: '5 กม.' },
            { value: 10, label: '10 กม.' }
          ]
        };
      }

      if (type === 'articles' || !type) {
        // Get categories
        const categories = await Article.distinct('category', { status: 'published' });
        
        // Get popular tags
        const tags = await Article.aggregate([
          { $match: { status: 'published' } },
          { $unwind: '$tags' },
          { $group: { _id: '$tags', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 20 }
        ]);

        filters.articles = {
          categories,
          tags: tags.map(t => t._id)
        };
      }

      res.json({
        success: true,
        data: filters
      });

    } catch (error) {
      console.error('Get search filters error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตัวกรอง'
      });
    }
  }
}

module.exports = new SearchController();
