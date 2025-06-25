package com.medicalswp.repository;

import com.medicalswp.entity.BlogPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BlogPostRepository extends JpaRepository<BlogPost, Long> {
    
    // Find by status
    List<BlogPost> findByStatus(BlogPost.Status status);
    
    // Find published blogs
    @Query("SELECT b FROM BlogPost b WHERE b.status = 'PUBLISHED' ORDER BY b.createdAt DESC")
    List<BlogPost> findPublishedBlogs();
    
    // Find featured blogs
    @Query("SELECT b FROM BlogPost b WHERE b.status = 'PUBLISHED' AND b.featured = true ORDER BY b.createdAt DESC")
    List<BlogPost> findFeaturedBlogs();
    
    // Find by category
    List<BlogPost> findByStatusAndCategory(BlogPost.Status status, String category);
    
    // Find by author
    List<BlogPost> findByAuthorContainingIgnoreCase(String author);
    
    // Find by title
    List<BlogPost> findByTitleContainingIgnoreCase(String title);
    
    // Search blogs
    @Query("SELECT b FROM BlogPost b WHERE " +
           "(LOWER(b.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.author) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.excerpt) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
           "ORDER BY b.createdAt DESC")
    List<BlogPost> searchBlogs(@Param("keyword") String keyword);
    
    // Count by status
    long countByStatus(BlogPost.Status status);
    
    // Count featured blogs
    @Query("SELECT COUNT(b) FROM BlogPost b WHERE b.status = 'PUBLISHED' AND b.featured = true")
    long countFeaturedBlogs();
} 