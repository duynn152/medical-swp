package com.medicalswp.controller;

import com.medicalswp.entity.Comment;
import com.medicalswp.entity.CommentReaction;
import com.medicalswp.service.CommentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/comments")
@CrossOrigin(origins = "*", maxAge = 3600)
public class CommentController {
    
    @Autowired
    private CommentService commentService;
    
    // Public endpoint - Get approved comments for a blog post
    @GetMapping("/blog/{blogPostId}")
    public ResponseEntity<Map<String, Object>> getCommentsByBlogPost(@PathVariable Long blogPostId) {
        try {
            List<Comment> comments = commentService.getApprovedCommentsByBlogPost(blogPostId);
            Long commentsCount = commentService.getCommentsCount(blogPostId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("comments", comments);
            response.put("count", commentsCount);
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching comments: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Public endpoint - Create a new comment
    @PostMapping("/blog/{blogPostId}")
    public ResponseEntity<Map<String, Object>> createComment(
            @PathVariable Long blogPostId,
            @RequestBody Map<String, String> commentData) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String authorName = commentData.get("authorName");
            String authorEmail = commentData.get("authorEmail");
            String content = commentData.get("content");
            
            // Validate input
            if (!commentService.isValidAuthorName(authorName)) {
                response.put("success", false);
                response.put("message", "Tên tác giả không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!commentService.isValidComment(content)) {
                response.put("success", false);
                response.put("message", "Nội dung bình luận không hợp lệ (tối đa 1000 ký tự)");
                return ResponseEntity.badRequest().body(response);
            }
            
            Comment comment = commentService.createComment(blogPostId, authorName, authorEmail, content);
            
            response.put("success", true);
            response.put("message", "Bình luận đã được thêm thành công");
            response.put("comment", comment);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi tạo bình luận: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // Admin endpoint - Get all comments for a blog post (including unapproved)
    @GetMapping("/admin/blog/{blogPostId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> getAllCommentsByBlogPost(@PathVariable Long blogPostId) {
        try {
            List<Comment> comments = commentService.getAllCommentsByBlogPost(blogPostId);
            Long approvedCount = commentService.getCommentsCount(blogPostId);
            Long totalCount = commentService.getAllCommentsCount(blogPostId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("comments", comments);
            response.put("approvedCount", approvedCount);
            response.put("totalCount", totalCount);
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching comments: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Admin endpoint - Get pending comments for moderation
    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> getPendingComments() {
        try {
            List<Comment> pendingComments = commentService.getPendingComments();
            
            Map<String, Object> response = new HashMap<>();
            response.put("comments", pendingComments);
            response.put("count", pendingComments.size());
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching pending comments: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Admin endpoint - Approve comment
    @PutMapping("/admin/{commentId}/approve")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> approveComment(@PathVariable Long commentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Comment comment = commentService.approveComment(commentId);
            response.put("success", true);
            response.put("message", "Bình luận đã được phê duyệt");
            response.put("comment", comment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi phê duyệt bình luận: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // Admin endpoint - Reject comment
    @PutMapping("/admin/{commentId}/reject")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> rejectComment(@PathVariable Long commentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Comment comment = commentService.rejectComment(commentId);
            response.put("success", true);
            response.put("message", "Bình luận đã bị từ chối");
            response.put("comment", comment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi từ chối bình luận: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // Admin endpoint - Delete comment
    @DeleteMapping("/admin/{commentId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('DOCTOR') or hasRole('STAFF')")
    public ResponseEntity<Map<String, Object>> deleteComment(@PathVariable Long commentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            commentService.deleteComment(commentId);
            response.put("success", true);
            response.put("message", "Bình luận đã được xóa");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi xóa bình luận: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // Get comment by ID
    @GetMapping("/{commentId}")
    public ResponseEntity<Map<String, Object>> getCommentById(@PathVariable Long commentId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<Comment> commentOpt = commentService.getCommentById(commentId);
            if (commentOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Bình luận không tồn tại");
                return ResponseEntity.notFound().build();
            }
            
            Comment comment = commentOpt.get();
            if (!comment.getApproved()) {
                response.put("success", false);
                response.put("message", "Bình luận chưa được phê duyệt");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
            
            response.put("success", true);
            response.put("comment", comment);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi lấy bình luận: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // ===== REACTION ENDPOINTS =====
    
    // Add or toggle reaction
    @PostMapping("/{commentId}/react")
    public ResponseEntity<Map<String, Object>> addReaction(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> reactionData,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String reactionTypeStr = reactionData.get("reactionType");
            if (reactionTypeStr == null || (!reactionTypeStr.equals("LIKE") && !reactionTypeStr.equals("DISLIKE"))) {
                response.put("success", false);
                response.put("message", "Invalid reaction type");
                return ResponseEntity.badRequest().body(response);
            }
            
            CommentReaction.ReactionType reactionType = CommentReaction.ReactionType.valueOf(reactionTypeStr);
            String userIdentifier = getClientIP(request);
            
            CommentReaction reaction = commentService.addReaction(commentId, userIdentifier, reactionType);
            
            response.put("success", true);
            response.put("reaction", reaction);
            response.put("message", reaction == null ? "Reaction removed" : "Reaction added");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error processing reaction: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // Get user's reaction for a comment
    @GetMapping("/{commentId}/my-reaction")
    public ResponseEntity<Map<String, Object>> getMyReaction(
            @PathVariable Long commentId,
            HttpServletRequest request) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String userIdentifier = getClientIP(request);
            Optional<CommentReaction> reaction = commentService.getUserReaction(commentId, userIdentifier);
            
            response.put("success", true);
            response.put("reaction", reaction.orElse(null));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error fetching reaction: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // ===== REPLY ENDPOINTS =====
    
    // Create a reply to a comment
    @PostMapping("/{commentId}/reply")
    public ResponseEntity<Map<String, Object>> createReply(
            @PathVariable Long commentId,
            @RequestBody Map<String, String> replyData) {
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String authorName = replyData.get("authorName");
            String authorEmail = replyData.get("authorEmail");
            String content = replyData.get("content");
            
            // Validate input
            if (!commentService.isValidAuthorName(authorName)) {
                response.put("success", false);
                response.put("message", "Tên tác giả không hợp lệ");
                return ResponseEntity.badRequest().body(response);
            }
            
            if (!commentService.isValidComment(content)) {
                response.put("success", false);
                response.put("message", "Nội dung trả lời không hợp lệ (tối đa 1000 ký tự)");
                return ResponseEntity.badRequest().body(response);
            }
            
            Comment reply = commentService.createReply(commentId, authorName, authorEmail, content);
            
            response.put("success", true);
            response.put("message", "Trả lời đã được thêm thành công");
            response.put("reply", reply);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi khi tạo trả lời: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
    
    // Get replies for a comment
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<Map<String, Object>> getReplies(@PathVariable Long commentId) {
        try {
            List<Comment> replies = commentService.getRepliesByCommentId(commentId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("replies", replies);
            response.put("count", replies.size());
            response.put("success", true);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Error fetching replies: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    // Helper method to get client IP
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
} 