package com.medicalswp.service;

import com.medicalswp.entity.Comment;
import com.medicalswp.entity.CommentReaction;
import com.medicalswp.entity.BlogPost;
import com.medicalswp.repository.CommentRepository;
import com.medicalswp.repository.CommentReactionRepository;
import com.medicalswp.repository.BlogPostRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CommentService {
    
    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private CommentReactionRepository commentReactionRepository;
    
    @Autowired
    private BlogPostRepository blogPostRepository;
    
    // Get all approved comments for a blog post
    public List<Comment> getApprovedCommentsByBlogPost(Long blogPostId) {
        return commentRepository.findByBlogPostIdAndParentCommentIsNullAndApprovedTrueOrderByCreatedAtAsc(blogPostId);
    }
    
    // Get all comments for a blog post (admin view)
    public List<Comment> getAllCommentsByBlogPost(Long blogPostId) {
        return commentRepository.findByBlogPostIdOrderByCreatedAtDesc(blogPostId);
    }
    
    // Create a new comment
    public Comment createComment(Long blogPostId, String authorName, String authorEmail, String content) {
        Optional<BlogPost> blogPostOpt = blogPostRepository.findById(blogPostId);
        if (blogPostOpt.isEmpty()) {
            throw new RuntimeException("Blog post not found with id: " + blogPostId);
        }
        
        BlogPost blogPost = blogPostOpt.get();
        
        // Check if blog post is published
        if (blogPost.getStatus() != BlogPost.Status.PUBLISHED) {
            throw new RuntimeException("Cannot comment on unpublished blog post");
        }
        
        Comment comment = new Comment(authorName, authorEmail, content, blogPost);
        // Auto-approve comments for now (can be changed to manual moderation)
        comment.setApproved(true);
        
        return commentRepository.save(comment);
    }
    
    // Get comment by ID
    public Optional<Comment> getCommentById(Long id) {
        return commentRepository.findById(id);
    }
    
    // Update comment (for editing)
    public Comment updateComment(Long id, String content) {
        Optional<Comment> commentOpt = commentRepository.findById(id);
        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found with id: " + id);
        }
        
        Comment comment = commentOpt.get();
        comment.setContent(content);
        return commentRepository.save(comment);
    }
    
    // Delete comment
    public void deleteComment(Long id) {
        if (!commentRepository.existsById(id)) {
            throw new RuntimeException("Comment not found with id: " + id);
        }
        commentRepository.deleteById(id);
    }
    
    // Approve comment (moderation)
    public Comment approveComment(Long id) {
        Optional<Comment> commentOpt = commentRepository.findById(id);
        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found with id: " + id);
        }
        
        Comment comment = commentOpt.get();
        comment.setApproved(true);
        return commentRepository.save(comment);
    }
    
    // Reject/Unapprove comment (moderation)
    public Comment rejectComment(Long id) {
        Optional<Comment> commentOpt = commentRepository.findById(id);
        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found with id: " + id);
        }
        
        Comment comment = commentOpt.get();
        comment.setApproved(false);
        return commentRepository.save(comment);
    }
    
    // Get all pending comments for moderation
    public List<Comment> getPendingComments() {
        return commentRepository.findByApprovedFalseOrderByCreatedAtDesc();
    }
    
    // Get comments count for a blog post
    public Long getCommentsCount(Long blogPostId) {
        return commentRepository.countByBlogPostIdAndApprovedTrue(blogPostId);
    }
    
    // Get all comments count (including unapproved) for a blog post
    public Long getAllCommentsCount(Long blogPostId) {
        return commentRepository.countByBlogPostId(blogPostId);
    }
    
    // Get comments by author email
    public List<Comment> getCommentsByAuthorEmail(String authorEmail) {
        return commentRepository.findByAuthorEmailOrderByCreatedAtDesc(authorEmail);
    }
    
    // Validate comment content (basic validation)
    public boolean isValidComment(String content) {
        if (content == null || content.trim().isEmpty()) {
            return false;
        }
        
        if (content.length() > 1000) {
            return false;
        }
        
        // Add more validation rules as needed (profanity filter, spam detection, etc.)
        return true;
    }
    
    // Validate author name
    public boolean isValidAuthorName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return false;
        }
        return name.length() <= 100;
    }
    
    // ===== REACTION METHODS =====
    
    // Add or update reaction
    public CommentReaction addReaction(Long commentId, String userIdentifier, CommentReaction.ReactionType reactionType) {
        Optional<Comment> commentOpt = commentRepository.findById(commentId);
        if (commentOpt.isEmpty()) {
            throw new RuntimeException("Comment not found with id: " + commentId);
        }
        
        Comment comment = commentOpt.get();
        
        // Check if user already reacted
        Optional<CommentReaction> existingReaction = commentReactionRepository
                .findByCommentIdAndUserIdentifier(commentId, userIdentifier);
        
        if (existingReaction.isPresent()) {
            CommentReaction reaction = existingReaction.get();
            if (reaction.getReactionType() == reactionType) {
                // Same reaction - remove it (toggle off)
                commentReactionRepository.delete(reaction);
                updateReactionCounts(comment);
                return null;
            } else {
                // Different reaction - update it
                reaction.setReactionType(reactionType);
                CommentReaction savedReaction = commentReactionRepository.save(reaction);
                updateReactionCounts(comment);
                return savedReaction;
            }
        } else {
            // New reaction
            CommentReaction newReaction = new CommentReaction(comment, userIdentifier, reactionType);
            CommentReaction savedReaction = commentReactionRepository.save(newReaction);
            updateReactionCounts(comment);
            return savedReaction;
        }
    }
    
    // Update cached reaction counts
    private void updateReactionCounts(Comment comment) {
        Long likeCount = commentReactionRepository.countByCommentIdAndReactionType(
                comment.getId(), CommentReaction.ReactionType.LIKE);
        Long dislikeCount = commentReactionRepository.countByCommentIdAndReactionType(
                comment.getId(), CommentReaction.ReactionType.DISLIKE);
        
        comment.setLikeCount(likeCount.intValue());
        comment.setDislikeCount(dislikeCount.intValue());
        commentRepository.save(comment);
    }
    
    // Get user's reaction for a comment
    public Optional<CommentReaction> getUserReaction(Long commentId, String userIdentifier) {
        return commentReactionRepository.findByCommentIdAndUserIdentifier(commentId, userIdentifier);
    }
    
    // ===== REPLY METHODS =====
    
    // Create a reply to a comment
    public Comment createReply(Long parentCommentId, String authorName, String authorEmail, String content) {
        Optional<Comment> parentCommentOpt = commentRepository.findById(parentCommentId);
        if (parentCommentOpt.isEmpty()) {
            throw new RuntimeException("Parent comment not found with id: " + parentCommentId);
        }
        
        Comment parentComment = parentCommentOpt.get();
        
        // Create reply
        Comment reply = new Comment(authorName, authorEmail, content, parentComment.getBlogPost());
        reply.setParentComment(parentComment);
        reply.setApproved(true); // Auto-approve replies for now
        
        return commentRepository.save(reply);
    }
    
    // Get replies for a comment
    public List<Comment> getRepliesByCommentId(Long commentId) {
        return commentRepository.findByParentCommentIdAndApprovedTrueOrderByCreatedAtAsc(commentId);
    }
    
    // Get top-level comments only (no replies)
    public List<Comment> getTopLevelCommentsByBlogPost(Long blogPostId) {
        return commentRepository.findByBlogPostIdAndParentCommentIsNullAndApprovedTrueOrderByCreatedAtAsc(blogPostId);
    }
} 