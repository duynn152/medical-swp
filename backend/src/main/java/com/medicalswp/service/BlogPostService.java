package com.medicalswp.service;

import com.medicalswp.entity.BlogPost;
import com.medicalswp.repository.BlogPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class BlogPostService {
    
    @Autowired
    private BlogPostRepository blogPostRepository;
    
    // Get all blog posts
    public List<BlogPost> getAllBlogs() {
        return blogPostRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }
    
    // Get blog by ID
    public Optional<BlogPost> getBlogById(Long id) {
        return blogPostRepository.findById(id);
    }
    
    // Get published blogs
    public List<BlogPost> getPublishedBlogs() {
        return blogPostRepository.findPublishedBlogs();
    }
    
    // Get featured blogs
    public List<BlogPost> getFeaturedBlogs() {
        return blogPostRepository.findFeaturedBlogs();
    }
    
    // Get blogs by status
    public List<BlogPost> getBlogsByStatus(BlogPost.Status status) {
        return blogPostRepository.findByStatus(status);
    }
    
    // Get blogs by category and status
    public List<BlogPost> getBlogsByStatusAndCategory(BlogPost.Status status, String category) {
        return blogPostRepository.findByStatusAndCategory(status, category);
    }
    
    // Search blogs
    public List<BlogPost> searchBlogs(String keyword) {
        return blogPostRepository.searchBlogs(keyword);
    }
    
    // Create new blog post
    public BlogPost createBlog(BlogPost blogPost) {
        return blogPostRepository.save(blogPost);
    }
    
    // Update blog post
    public BlogPost updateBlog(Long id, BlogPost updatedBlog) {
        return blogPostRepository.findById(id)
            .map(blog -> {
                blog.setTitle(updatedBlog.getTitle());
                blog.setExcerpt(updatedBlog.getExcerpt());
                blog.setContent(updatedBlog.getContent());
                blog.setAuthor(updatedBlog.getAuthor());
                blog.setCategory(updatedBlog.getCategory());
                blog.setStatus(updatedBlog.getStatus());
                blog.setFeatured(updatedBlog.getFeatured());
                blog.setReadTime(updatedBlog.getReadTime());
                return blogPostRepository.save(blog);
            })
            .orElseThrow(() -> new RuntimeException("Blog post not found with id: " + id));
    }
    
    // Update blog status
    public BlogPost updateBlogStatus(Long id, BlogPost.Status status) {
        return blogPostRepository.findById(id)
            .map(blog -> {
                blog.setStatus(status);
                return blogPostRepository.save(blog);
            })
            .orElseThrow(() -> new RuntimeException("Blog post not found with id: " + id));
    }
    
    // Toggle featured status
    public BlogPost toggleFeatured(Long id) {
        return blogPostRepository.findById(id)
            .map(blog -> {
                blog.setFeatured(!blog.getFeatured());
                return blogPostRepository.save(blog);
            })
            .orElseThrow(() -> new RuntimeException("Blog post not found with id: " + id));
    }
    
    // Delete blog post
    public void deleteBlog(Long id) {
        blogPostRepository.deleteById(id);
    }
    
    // Get blog statistics
    public BlogStats getBlogStats() {
        long total = blogPostRepository.count();
        long published = blogPostRepository.countByStatus(BlogPost.Status.PUBLISHED);
        long draft = blogPostRepository.countByStatus(BlogPost.Status.DRAFT);
        long featured = blogPostRepository.countFeaturedBlogs();
        
        return new BlogStats(total, published, draft, featured);
    }
    
    // Blog statistics class
    public static class BlogStats {
        private long total;
        private long published;
        private long draft;
        private long featured;
        
        public BlogStats(long total, long published, long draft, long featured) {
            this.total = total;
            this.published = published;
            this.draft = draft;
            this.featured = featured;
        }
        
        // Getters
        public long getTotal() { return total; }
        public long getPublished() { return published; }
        public long getDraft() { return draft; }
        public long getFeatured() { return featured; }
        
        // Setters
        public void setTotal(long total) { this.total = total; }
        public void setPublished(long published) { this.published = published; }
        public void setDraft(long draft) { this.draft = draft; }
        public void setFeatured(long featured) { this.featured = featured; }
    }
} 