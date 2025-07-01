package com.medicalswp.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "comments")
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Comment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank
    @Size(max = 100)
    private String authorName;
    
    @Size(max = 100)
    private String authorEmail;
    
    @NotBlank
    @Size(max = 1000)
    @Column(columnDefinition = "TEXT")
    private String content;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blog_post_id", nullable = false)
    @JsonIgnore
    private BlogPost blogPost;
    
    // Parent comment for replies (self-referencing)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    @JsonIgnore
    private Comment parentComment;
    
    // Child comments (replies)
    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"parentComment", "blogPost"})
    private List<Comment> replies = new ArrayList<>();
    
    // Reactions
    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<CommentReaction> reactions = new ArrayList<>();
    
    // Cached reaction counts for performance
    @Column(nullable = false)
    private Integer likeCount = 0;
    
    @Column(nullable = false)
    private Integer dislikeCount = 0;
    
    @Column(nullable = false)
    private Boolean approved = false; // For moderation
    
    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    // Constructors
    public Comment() {}
    
    public Comment(String authorName, String authorEmail, String content, BlogPost blogPost) {
        this.authorName = authorName;
        this.authorEmail = authorEmail;
        this.content = content;
        this.blogPost = blogPost;
    }
    
    // Getters and Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getAuthorName() {
        return authorName;
    }
    
    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }
    
    public String getAuthorEmail() {
        return authorEmail;
    }
    
    public void setAuthorEmail(String authorEmail) {
        this.authorEmail = authorEmail;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public BlogPost getBlogPost() {
        return blogPost;
    }
    
    public void setBlogPost(BlogPost blogPost) {
        this.blogPost = blogPost;
    }
    
    public Boolean getApproved() {
        return approved;
    }
    
    public void setApproved(Boolean approved) {
        this.approved = approved;
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
    
    public Comment getParentComment() {
        return parentComment;
    }
    
    public void setParentComment(Comment parentComment) {
        this.parentComment = parentComment;
    }
    
    public List<Comment> getReplies() {
        return replies;
    }
    
    public void setReplies(List<Comment> replies) {
        this.replies = replies;
    }
    
    public List<CommentReaction> getReactions() {
        return reactions;
    }
    
    public void setReactions(List<CommentReaction> reactions) {
        this.reactions = reactions;
    }
    
    public Integer getLikeCount() {
        return likeCount;
    }
    
    public void setLikeCount(Integer likeCount) {
        this.likeCount = likeCount;
    }
    
    public Integer getDislikeCount() {
        return dislikeCount;
    }
    
    public void setDislikeCount(Integer dislikeCount) {
        this.dislikeCount = dislikeCount;
    }
    
    @Override
    public String toString() {
        return "Comment{" +
                "id=" + id +
                ", authorName='" + authorName + '\'' +
                ", authorEmail='" + authorEmail + '\'' +
                ", content='" + content + '\'' +
                ", approved=" + approved +
                ", createdAt=" + createdAt +
                '}';
    }
} 