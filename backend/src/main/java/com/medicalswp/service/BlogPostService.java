package com.medicalswp.service;

import com.medicalswp.entity.BlogPost;
import com.medicalswp.repository.BlogPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;
import java.util.List;
import java.util.Optional;

@Service
public class BlogPostService {
    
    @Autowired
    private BlogPostRepository blogPostRepository;
    
    // Upload directory for images
    private static final String UPLOAD_DIR = "uploads/blog-images/";
    private static final String[] ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"};
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    
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
                blog.setImageUrl(updatedBlog.getImageUrl());
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
    
    // Upload image for blog post
    public String uploadImage(MultipartFile file) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File rỗng");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File quá lớn. Tối đa 5MB");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new IllegalArgumentException("Tên file không hợp lệ");
        }
        
        // Check file extension
        String fileExtension = getFileExtension(originalFilename).toLowerCase();
        boolean isValidExtension = false;
        for (String allowedExt : ALLOWED_EXTENSIONS) {
            if (fileExtension.equals(allowedExt)) {
                isValidExtension = true;
                break;
            }
        }
        
        if (!isValidExtension) {
            throw new IllegalArgumentException("Định dạng file không được hỗ trợ. Chỉ chấp nhận: JPG, JPEG, PNG, GIF, WebP");
        }
        
        // Create upload directory if not exists
        Path uploadPath = Paths.get(UPLOAD_DIR);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }
        
        // Generate unique filename
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String fileName = "blog_" + timestamp + "_" + uniqueId + fileExtension;
        
        // Save file
        Path filePath = uploadPath.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Return relative URL path
        return "/uploads/blog-images/" + fileName;
    }
    
    private String getFileExtension(String filename) {
        int lastIndexOf = filename.lastIndexOf(".");
        if (lastIndexOf == -1) {
            return ""; // empty extension
        }
        return filename.substring(lastIndexOf);
    }
} 