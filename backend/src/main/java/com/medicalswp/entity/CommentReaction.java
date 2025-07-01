package com.medicalswp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

@Entity
@Table(name = "comment_reactions")
@EntityListeners(AuditingEntityListener.class)
public class CommentReaction {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    @JsonIgnore
    private Comment comment;
    
    @NotBlank
    @Size(max = 50)
    private String userIdentifier; // IP address or session ID
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReactionType reactionType;
    
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Constructors
    public CommentReaction() {}
    
    public CommentReaction(Comment comment, String userIdentifier, ReactionType reactionType) {
        this.comment = comment;
        this.userIdentifier = userIdentifier;
        this.reactionType = reactionType;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Comment getComment() {
        return comment;
    }
    
    public void setComment(Comment comment) {
        this.comment = comment;
    }
    
    public String getUserIdentifier() {
        return userIdentifier;
    }
    
    public void setUserIdentifier(String userIdentifier) {
        this.userIdentifier = userIdentifier;
    }
    
    public ReactionType getReactionType() {
        return reactionType;
    }
    
    public void setReactionType(ReactionType reactionType) {
        this.reactionType = reactionType;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public enum ReactionType {
        LIKE, DISLIKE
    }
    
    @Override
    public String toString() {
        return "CommentReaction{" +
                "id=" + id +
                ", userIdentifier='" + userIdentifier + '\'' +
                ", reactionType=" + reactionType +
                ", createdAt=" + createdAt +
                '}';
    }
} 