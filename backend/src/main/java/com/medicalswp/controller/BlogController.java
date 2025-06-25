package com.medicalswp.controller;

import com.medicalswp.entity.BlogPost;
import com.medicalswp.service.BlogPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/blogs")
@CrossOrigin(origins = "*")
public class BlogController {
    
    @Autowired
    private BlogPostService blogPostService;
    
    // Get all blogs (for admin)
    @GetMapping
    public ResponseEntity<List<BlogPost>> getAllBlogs() {
        List<BlogPost> blogs = blogPostService.getAllBlogs();
        return ResponseEntity.ok(blogs);
    }
    
    // Get blog by ID
    @GetMapping("/{id}")
    public ResponseEntity<BlogPost> getBlogById(@PathVariable Long id) {
        return blogPostService.getBlogById(id)
            .map(blog -> ResponseEntity.ok(blog))
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Get published blogs (for public)
    @GetMapping("/published")
    public ResponseEntity<List<BlogPost>> getPublishedBlogs() {
        List<BlogPost> blogs = blogPostService.getPublishedBlogs();
        return ResponseEntity.ok(blogs);
    }
    
    // Get featured blogs (for public)
    @GetMapping("/featured")
    public ResponseEntity<List<BlogPost>> getFeaturedBlogs() {
        List<BlogPost> blogs = blogPostService.getFeaturedBlogs();
        return ResponseEntity.ok(blogs);
    }
    
    // Get blogs by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<BlogPost>> getBlogsByStatus(@PathVariable String status) {
        try {
            BlogPost.Status blogStatus = BlogPost.Status.valueOf(status.toUpperCase());
            List<BlogPost> blogs = blogPostService.getBlogsByStatus(blogStatus);
            return ResponseEntity.ok(blogs);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Get blogs by category (published only)
    @GetMapping("/category/{category}")
    public ResponseEntity<List<BlogPost>> getBlogsByCategory(@PathVariable String category) {
        List<BlogPost> blogs = blogPostService.getBlogsByStatusAndCategory(BlogPost.Status.PUBLISHED, category);
        return ResponseEntity.ok(blogs);
    }
    
    // Search blogs
    @GetMapping("/search")
    public ResponseEntity<List<BlogPost>> searchBlogs(@RequestParam String q) {
        List<BlogPost> blogs = blogPostService.searchBlogs(q);
        return ResponseEntity.ok(blogs);
    }
    
    // Get blog statistics
    @GetMapping("/stats")
    public ResponseEntity<BlogPostService.BlogStats> getBlogStats() {
        BlogPostService.BlogStats stats = blogPostService.getBlogStats();
        return ResponseEntity.ok(stats);
    }
    
    // Create new blog post
    @PostMapping
    public ResponseEntity<BlogPost> createBlog(@RequestBody BlogPost blogPost) {
        try {
            BlogPost createdBlog = blogPostService.createBlog(blogPost);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdBlog);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Update blog post
    @PutMapping("/{id}")
    public ResponseEntity<BlogPost> updateBlog(@PathVariable Long id, @RequestBody BlogPost blogPost) {
        try {
            BlogPost updatedBlog = blogPostService.updateBlog(id, blogPost);
            return ResponseEntity.ok(updatedBlog);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Update blog status
    @PutMapping("/{id}/status")
    public ResponseEntity<BlogPost> updateBlogStatus(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String statusStr = request.get("status");
            BlogPost.Status status = BlogPost.Status.valueOf(statusStr.toUpperCase());
            BlogPost updatedBlog = blogPostService.updateBlogStatus(id, status);
            return ResponseEntity.ok(updatedBlog);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // Toggle featured status
    @PutMapping("/{id}/featured")
    public ResponseEntity<BlogPost> toggleFeatured(@PathVariable Long id) {
        try {
            BlogPost updatedBlog = blogPostService.toggleFeatured(id);
            return ResponseEntity.ok(updatedBlog);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // Delete blog post
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBlog(@PathVariable Long id) {
        try {
            blogPostService.deleteBlog(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
} 