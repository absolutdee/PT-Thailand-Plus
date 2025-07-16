// reviewUtils.js - Utility functions for review and rating system

import moment from 'moment';
import DOMPurify from 'dompurify';
import Filter from 'bad-words';

class ReviewUtils {
    constructor() {
        this.profanityFilter = new Filter();
        this.minReviewLength = 10;
        this.maxReviewLength = 1000;
        this.ratingScale = 5;
        this.sentimentKeywords = {
            positive: ['excellent', 'amazing', 'great', 'wonderful', 'fantastic', 'love', 'best', 'awesome', 'perfect', 'recommend'],
            negative: ['terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'disappoint', 'poor', 'waste', 'avoid'],
        };
    }

    // Validate review
    validateReview(reviewData) {
        const errors = [];
        const { rating, title, content, trainerId, clientId } = reviewData;

        // Validate rating
        if (!rating || rating < 1 || rating > this.ratingScale) {
            errors.push(`Rating must be between 1 and ${this.ratingScale}`);
        }

        // Validate title
        if (title && title.length > 100) {
            errors.push('Title must be less than 100 characters');
        }

        // Validate content
        if (!content || content.trim().length < this.minReviewLength) {
            errors.push(`Review must be at least ${this.minReviewLength} characters`);
        }

        if (content && content.length > this.maxReviewLength) {
            errors.push(`Review must be less than ${this.maxReviewLength} characters`);
        }

        // Check for profanity
        if (content && this.containsProfanity(content)) {
            errors.push('Review contains inappropriate language');
        }

        // Validate IDs
        if (!trainerId) {
            errors.push('Trainer ID is required');
        }

        if (!clientId) {
            errors.push('Client ID is required');
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    // Check for profanity
    containsProfanity(text) {
        return this.profanityFilter.isProfane(text);
    }

    // Clean review content
    cleanReviewContent(content) {
        // Sanitize HTML
        const cleaned = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: [],
            ALLOWED_ATTR: [],
        });

        // Clean profanity
        return this.profanityFilter.clean(cleaned);
    }

    // Calculate average rating
    calculateAverageRating(reviews) {
        if (!reviews || reviews.length === 0) {
            return {
                average: 0,
                count: 0,
                distribution: this.getEmptyDistribution(),
            };
        }

        const total = reviews.reduce((sum, review) => sum + review.rating, 0);
        const average = total / reviews.length;

        // Calculate distribution
        const distribution = this.calculateRatingDistribution(reviews);

        return {
            average: Math.round(average * 10) / 10,
            count: reviews.length,
            distribution,
        };
    }

    // Calculate rating distribution
    calculateRatingDistribution(reviews) {
        const distribution = this.getEmptyDistribution();

        reviews.forEach(review => {
            if (review.rating >= 1 && review.rating <= this.ratingScale) {
                distribution[review.rating]++;
            }
        });

        // Convert to percentages
        const total = reviews.length;
        Object.keys(distribution).forEach(rating => {
            distribution[rating] = {
                count: distribution[rating],
                percentage: total > 0 ? (distribution[rating] / total) * 100 : 0,
            };
        });

        return distribution;
    }

    // Get empty distribution object
    getEmptyDistribution() {
        const distribution = {};
        for (let i = 1; i <= this.ratingScale; i++) {
            distribution[i] = 0;
        }
        return distribution;
    }

    // Format review for display
    formatReview(review) {
        return {
            id: review._id || review.id,
            rating: review.rating,
            title: review.title || '',
            content: this.cleanReviewContent(review.content),
            author: {
                id: review.clientId,
                name: review.clientName || 'Anonymous',
                avatar: review.clientAvatar || null,
            },
            trainer: {
                id: review.trainerId,
                name: review.trainerName || '',
            },
            date: moment(review.createdAt).format('MMMM D, YYYY'),
            timeAgo: moment(review.createdAt).fromNow(),
            verified: review.verified || false,
            helpful: review.helpful || 0,
            notHelpful: review.notHelpful || 0,
            response: review.response ? {
                content: review.response.content,
                date: moment(review.response.createdAt).format('MMMM D, YYYY'),
            } : null,
        };
    }

    // Sort reviews
    sortReviews(reviews, sortBy = 'recent') {
        const sorted = [...reviews];

        switch (sortBy) {
            case 'recent':
                return sorted.sort((a, b) => 
                    moment(b.createdAt).diff(moment(a.createdAt))
                );

            case 'oldest':
                return sorted.sort((a, b) => 
                    moment(a.createdAt).diff(moment(b.createdAt))
                );

            case 'highest':
                return sorted.sort((a, b) => b.rating - a.rating);

            case 'lowest':
                return sorted.sort((a, b) => a.rating - b.rating);

            case 'helpful':
                return sorted.sort((a, b) => 
                    (b.helpful - b.notHelpful) - (a.helpful - a.notHelpful)
                );

            default:
                return sorted;
        }
    }

    // Filter reviews
    filterReviews(reviews, filters) {
        let filtered = [...reviews];

        // Filter by rating
        if (filters.rating) {
            if (Array.isArray(filters.rating)) {
                filtered = filtered.filter(review => 
                    filters.rating.includes(review.rating)
                );
            } else {
                filtered = filtered.filter(review => 
                    review.rating === filters.rating
                );
            }
        }

        // Filter by verified
        if (filters.verified !== undefined) {
            filtered = filtered.filter(review => 
                review.verified === filters.verified
            );
        }

        // Filter by date range
        if (filters.startDate || filters.endDate) {
            filtered = filtered.filter(review => {
                const reviewDate = moment(review.createdAt);
                
                if (filters.startDate && reviewDate.isBefore(moment(filters.startDate))) {
                    return false;
                }
                
                if (filters.endDate && reviewDate.isAfter(moment(filters.endDate))) {
                    return false;
                }
                
                return true;
            });
        }

        // Filter by keyword
        if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            filtered = filtered.filter(review => 
                review.content.toLowerCase().includes(keyword) ||
                (review.title && review.title.toLowerCase().includes(keyword))
            );
        }

        return filtered;
    }

    // Analyze review sentiment
    analyzeReviewSentiment(content) {
        const contentLower = content.toLowerCase();
        let positiveScore = 0;
        let negativeScore = 0;

        // Count sentiment keywords
        this.sentimentKeywords.positive.forEach(keyword => {
            const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
            positiveScore += matches;
        });

        this.sentimentKeywords.negative.forEach(keyword => {
            const matches = (contentLower.match(new RegExp(keyword, 'g')) || []).length;
            negativeScore += matches;
        });

        // Determine overall sentiment
        let sentiment = 'neutral';
        if (positiveScore > negativeScore) {
            sentiment = 'positive';
        } else if (negativeScore > positiveScore) {
            sentiment = 'negative';
        }

        return {
            sentiment,
            positiveScore,
            negativeScore,
            confidence: Math.abs(positiveScore - negativeScore) / (positiveScore + negativeScore || 1),
        };
    }

    // Get review insights
    getReviewInsights(reviews) {
        if (!reviews || reviews.length === 0) {
            return {
                totalReviews: 0,
                averageRating: 0,
                sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
                commonKeywords: [],
                recommendationRate: 0,
            };
        }

        const insights = {
            totalReviews: reviews.length,
            averageRating: this.calculateAverageRating(reviews).average,
            sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
            commonKeywords: [],
            recommendationRate: 0,
        };

        // Analyze each review
        const wordFrequency = new Map();
        let recommendCount = 0;

        reviews.forEach(review => {
            // Sentiment analysis
            const sentiment = this.analyzeReviewSentiment(review.content);
            insights.sentimentBreakdown[sentiment.sentiment]++;

            // Check for recommendations
            if (review.content.toLowerCase().includes('recommend')) {
                recommendCount++;
            }

            // Extract keywords
            const words = review.content.toLowerCase()
                .replace(/[^\w\s]/g, '')
                .split(/\s+/)
                .filter(word => word.length > 4); // Only words longer than 4 chars

            words.forEach(word => {
                wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
            });
        });

        // Calculate percentages
        insights.sentimentBreakdown = {
            positive: (insights.sentimentBreakdown.positive / reviews.length) * 100,
            neutral: (insights.sentimentBreakdown.neutral / reviews.length) * 100,
            negative: (insights.sentimentBreakdown.negative / reviews.length) * 100,
        };

        // Get top keywords
        insights.commonKeywords = Array.from(wordFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({ word, count }));

        // Calculate recommendation rate
        insights.recommendationRate = (recommendCount / reviews.length) * 100;

        return insights;
    }

    // Generate review summary
    generateReviewSummary(reviews) {
        const stats = this.calculateAverageRating(reviews);
        const insights = this.getReviewInsights(reviews);

        return {
            averageRating: stats.average,
            totalReviews: stats.count,
            distribution: stats.distribution,
            recommendationRate: Math.round(insights.recommendationRate),
            recentReviews: this.sortReviews(reviews, 'recent').slice(0, 5),
            topPositiveReview: this.getTopReview(reviews, 'positive'),
            topCriticalReview: this.getTopReview(reviews, 'critical'),
        };
    }

    // Get top review by type
    getTopReview(reviews, type) {
        let topReview = null;

        if (type === 'positive') {
            topReview = reviews
                .filter(r => r.rating >= 4)
                .sort((a, b) => (b.helpful - b.notHelpful) - (a.helpful - a.notHelpful))[0];
        } else if (type === 'critical') {
            topReview = reviews
                .filter(r => r.rating <= 2)
                .sort((a, b) => (b.helpful - b.notHelpful) - (a.helpful - a.notHelpful))[0];
        }

        return topReview ? this.formatReview(topReview) : null;
    }

    // Check if user can review
    canUserReview(userId, trainerId, sessions) {
        // Check if user has completed sessions with trainer
        const completedSessions = sessions.filter(session => 
            session.clientId === userId &&
            session.trainerId === trainerId &&
            session.status === 'completed'
        );

        return completedSessions.length > 0;
    }

    // Generate review prompt
    generateReviewPrompt(trainerName, sessionType) {
        const prompts = {
            rating: `How would you rate your experience with ${trainerName}?`,
            title: 'Give your review a title',
            content: {
                training: [
                    `How was your training session with ${trainerName}?`,
                    'What did you like most about the training?',
                    'What could be improved?',
                    'Would you recommend this trainer to others?',
                ].join('\n'),
                nutrition: [
                    `How helpful was ${trainerName}'s nutrition guidance?`,
                    'Did the meal plans work for you?',
                    'How easy was it to follow the recommendations?',
                ].join('\n'),
            },
        };

        return prompts;
    }

    // Moderate review content
    async moderateReview(content) {
        // Check for spam patterns
        const spamPatterns = [
            /\b(buy|cheap|discount|offer|limited time)\b/gi,
            /\b(click here|visit|www\.|https?:\/\/)\b/gi,
            /(.)\1{4,}/g, // Repeated characters
            /[A-Z]{5,}/g, // All caps
        ];

        const issues = [];

        spamPatterns.forEach((pattern, index) => {
            if (pattern.test(content)) {
                issues.push('Potential spam content detected');
            }
        });

        // Check content quality
        const wordCount = content.split(/\s+/).length;
        if (wordCount < 5) {
            issues.push('Review is too short');
        }

        // Check for copied content (would need external API in production)
        // This is a placeholder
        const uniquenessScore = Math.random();
        if (uniquenessScore < 0.3) {
            issues.push('Review appears to be copied');
        }

        return {
            approved: issues.length === 0,
            issues,
            requiresManualReview: issues.length > 0 && issues.length < 3,
        };
    }

    // Export reviews
    exportReviews(reviews, format = 'csv') {
        const exportData = reviews.map(review => ({
            date: moment(review.createdAt).format('YYYY-MM-DD'),
            rating: review.rating,
            title: review.title || '',
            content: review.content,
            author: review.clientName || 'Anonymous',
            verified: review.verified ? 'Yes' : 'No',
            helpful: review.helpful || 0,
        }));

        switch (format) {
            case 'csv':
                return this.convertToCSV(exportData);
            case 'json':
                return JSON.stringify(exportData, null, 2);
            default:
                throw new Error(`Unsupported format: ${format}`);
        }
    }

    // Convert to CSV
    convertToCSV(data) {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    return typeof value === 'string' && value.includes(',')
                        ? `"${value}"`
                        : value;
                }).join(',')
            ),
        ].join('\n');

        return csvContent;
    }
}

// Export singleton instance
const reviewUtils = new ReviewUtils();
export default reviewUtils;

// Export individual functions
export const {
    validateReview,
    cleanReviewContent,
    calculateAverageRating,
    formatReview,
    sortReviews,
    filterReviews,
    analyzeReviewSentiment,
    getReviewInsights,
    generateReviewSummary,
    canUserReview,
    generateReviewPrompt,
    moderateReview,
    exportReviews,
} = reviewUtils;
