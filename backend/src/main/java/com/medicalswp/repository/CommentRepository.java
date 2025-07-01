package com.medicalswp.repository;

import com.medicalswp.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    
    // Find all approved comments for a blog post, ordered by creation date
    List<Comment> findByBlogPostIdAndApprovedTrueOrderByCreatedAtAsc(Long blogPostId);
    
    // Find all comments for a blog post (for admin/moderation)
    List<Comment> findByBlogPostIdOrderByCreatedAtDesc(Long blogPostId);
    
    // Count approved comments for a blog post
    Long countByBlogPostIdAndApprovedTrue(Long blogPostId);
    
    // Count all comments for a blog post
    Long countByBlogPostId(Long blogPostId);
    
    // Find all pending comments (for moderation)
    List<Comment> findByApprovedFalseOrderByCreatedAtDesc();
    
    // Find comments by author email
    List<Comment> findByAuthorEmailOrderByCreatedAtDesc(String authorEmail);
    
    // Custom query to find recent comments for a blog post
    @Query("SELECT c FROM Comment c WHERE c.blogPost.id = :blogPostId AND c.approved = true ORDER BY c.createdAt DESC")
    List<Comment> findRecentApprovedComments(@Param("blogPostId") Long blogPostId);
    
    // Find replies for a parent comment
    List<Comment> findByParentCommentIdAndApprovedTrueOrderByCreatedAtAsc(Long parentCommentId);
    
    // Find top-level comments (no parent) for a blog post
    List<Comment> findByBlogPostIdAndParentCommentIsNullAndApprovedTrueOrderByCreatedAtAsc(Long blogPostId);
    
    // Find all top-level comments (including unapproved) for admin
    List<Comment> findByBlogPostIdAndParentCommentIsNullOrderByCreatedAtDesc(Long blogPostId);
} 