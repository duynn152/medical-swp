package com.medicalswp.controller;

import com.medicalswp.entity.BlogPost;
import com.medicalswp.service.BlogPostService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/public/blogs")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:3001"})
public class PublicBlogController {
    
    @Autowired
    private BlogPostService blogPostService;
    
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
    
    // Get blog by ID (public access for reading)
    @GetMapping("/{id}")
    public ResponseEntity<BlogPost> getBlogById(@PathVariable Long id) {
        return blogPostService.getBlogById(id)
            .filter(blog -> blog.getStatus() == BlogPost.Status.PUBLISHED) // Only published blogs
            .map(blog -> ResponseEntity.ok(blog))
            .orElse(ResponseEntity.notFound().build());
    }
    
    // Get blogs by category (published only)
    @GetMapping("/category/{category}")
    public ResponseEntity<List<BlogPost>> getBlogsByCategory(@PathVariable String category) {
        List<BlogPost> blogs = blogPostService.getBlogsByStatusAndCategory(BlogPost.Status.PUBLISHED, category);
        return ResponseEntity.ok(blogs);
    }
    
    // Search published blogs
    @GetMapping("/search")
    public ResponseEntity<List<BlogPost>> searchBlogs(@RequestParam String q) {
        List<BlogPost> allBlogs = blogPostService.searchBlogs(q);
        // Filter to only published blogs
        List<BlogPost> publishedBlogs = allBlogs.stream()
            .filter(blog -> blog.getStatus() == BlogPost.Status.PUBLISHED)
            .toList();
        return ResponseEntity.ok(publishedBlogs);
    }
} 