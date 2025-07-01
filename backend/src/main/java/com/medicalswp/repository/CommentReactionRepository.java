package com.medicalswp.repository;

import com.medicalswp.entity.CommentReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {
    
    // Find reaction by comment and user identifier
    Optional<CommentReaction> findByCommentIdAndUserIdentifier(Long commentId, String userIdentifier);
    
    // Find all reactions for a comment
    List<CommentReaction> findByCommentIdOrderByCreatedAtDesc(Long commentId);
    
    // Count likes for a comment
    Long countByCommentIdAndReactionType(Long commentId, CommentReaction.ReactionType reactionType);
    
    // Delete reaction by comment and user
    void deleteByCommentIdAndUserIdentifier(Long commentId, String userIdentifier);
    
    // Get reaction stats for a comment
    @Query("SELECT r.reactionType, COUNT(r) FROM CommentReaction r WHERE r.comment.id = :commentId GROUP BY r.reactionType")
    List<Object[]> getReactionStats(@Param("commentId") Long commentId);
} 