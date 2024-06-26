import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import '../../css/ModalComponent.css';
import ImageGalleryComponent from "../bbs/ImageGalleryComponent";
import ConfirmModal from './ConfirmModal';
import EditModal from './EditModal';
import api from "../api";

const ModalComponent = ({ postId: propPostId, show: propShow, onClose: propOnClose }) => {
  const { postId: routePostId } = useParams();
  const navigate = useNavigate();
  const postId = propPostId || routePostId;
  const show = propShow !== undefined ? propShow : !!routePostId;
  const onClose = propOnClose || (() => navigate('/snspostlist'));

  const [comments, setComments] = useState([]);
  const [post, setPost] = useState({});
  const [repliesVisible, setRepliesVisible] = useState({});
  const token = localStorage.getItem("bbs_access_token");
  const [commentContent, setCommentContent] = useState("");
  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [editedTags, setEditedTags] = useState('');

  const loggedInUser = localStorage.getItem("nickname");
  const isUserPostOwner = loggedInUser === post.createdBy;
  const [showDelete, setShowDelete] = useState(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (show) {
      setIsLoading(true);

      const fetchData = async () => {
        try {
          await fetchPost();
          await fetchComments();
        } catch (error) {
          console.error('Failed to load data', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
      console.log('Modal should be visible for post:', postId);
    }
  }, [show, postId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuModalRef.current && !menuModalRef.current.contains(event.target) &&
        menuButtonRef.current && !menuButtonRef.current.contains(event.target)) {
        if (isMenuModalOpen) {
          closeMenuModal();
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuModalOpen]);

  const openMenuModal = () => {
    setIsMenuModalOpen(true);
  };
  const menuModalRef = useRef(null);
  const menuButtonRef = useRef(null);

  const closeMenuModal = () => {
    setIsMenuModalOpen(false);
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`${process.env.REACT_APP_SERVER_URL}/plant-sns-service/snsComment/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComments(response.data);
      console.log(response.data);
    } catch (error) {
      console.error('Failed to load comments', error);
    }
  };

  const saveComment = async (postId, createdBy, parentCommentId) => {
    const snsCommentRequestDto = {
      snsPostId: postId,
      content: commentContent,
      createdBy: createdBy,
      senderNo: localStorage.getItem("id"),
      parentId: parentCommentId
    };
    setSelectedCommentId(null);
    console.log(snsCommentRequestDto);
    try {
      const response = await api.post(`${process.env.REACT_APP_SERVER_URL}/plant-sns-service/snsComment`, snsCommentRequestDto, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setComments([...comments, response.data]);
      fetchComments();
      setCommentContent("");
      alert("댓글을 성공적으로 등록했습니다 :D");
    } catch (error) {
      console.error('댓글을 저장하는데 데 실패했습니다.', error);
    }
  };

  const fetchPost = async () => {
    try {
      const response = await api.get(`${process.env.REACT_APP_SERVER_URL}/plant-sns-service/snsPost/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPost(response.data);
      console.log(response.data);
    } catch (error) {
      const resp = error.response.data;
      console.log(resp);
      if (resp.errorCodeName === "022") {
        alert(resp.message);
      }
    }
  };

  const handleReply = (username, commentId) => {
    setCommentContent(`@${username} `);
    setSelectedCommentId(commentId);
    commentInputRef.current.focus();
  };

  const deletePost = async () => {
    try {
      await api.delete(`${process.env.REACT_APP_SERVER_URL}/plant-sns-service/snsPost/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("게시글이 삭제되었습니다.");
      onClose();
    } catch (error) {
      console.error('게시글을 삭제하는데 실패했습니다.', error);
    }
  };

  const updatePost = async () => {
    console.log(editedTags);
    const tagsArray = editedTags.map(tag => tag.trim().replace(/^#/, ''));
    console.log(editedTags);
    const snsPostRequestDto = {
      id: postId,
      snsPostContent: editedContent,
      hashTags: tagsArray,
    };

    try {
      const response = await api.patch(`${process.env.REACT_APP_SERVER_URL}/plant-sns-service/snsPost`, snsPostRequestDto, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.status === 200) {
        alert("게시글이 수정되었습니다.");
        setIsEditModalOpen(false);
        fetchPost();
      }
    } catch (error) {
      const resp = error.response.data;
      console.log(resp);
      if (resp.errorCodeName === "022") {
        alert(resp.message);
      }
    }
  };

  const commentInputRef = useRef(null);

  const toggleReplies = (commentId) => {
    setRepliesVisible(prevRepliesVisible => ({
      ...prevRepliesVisible,
      [commentId]: !prevRepliesVisible[commentId]
    }));
  };

  const handleEditButtonClick = () => {
    setEditedContent(post.snsPostContent);
    setEditedTags(post.hashTags);
    setIsEditModalOpen(true);
  };

  const onModalOutsideClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!show) {
    return null;
  }

  const getTimeSince = (createdAtArray) => {
    console.log(createdAtArray);
    const postDate = new Date(createdAtArray[0], createdAtArray[1] - 1, createdAtArray[2],
                              createdAtArray[3], createdAtArray[4], createdAtArray[5]);
    const now = new Date();
    const secondsPast = (now - postDate) / 1000;

    if (secondsPast < 60) {
      return `방금 전`;
    }
    if (secondsPast < 3600) {
      return `${Math.round(secondsPast / 60)}분 전`;
    }
    if (secondsPast < 86400) {
      return `${Math.round(secondsPast / 3600)}시간 전`;
    }
    if (secondsPast < 172800) {
      return `어제`;
    }

    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Seoul'
    }).format(postDate);
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`${process.env.REACT_APP_SERVER_URL}/plant-sns-service/snsComment/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(comments.filter(comment => comment.id !== commentId));
      setShowDelete(null);
      alert("댓글이 삭제되었습니다.");
    } catch (error) {
      console.error('댓글을 삭제하는데 실패했습니다.', error);
    }
  };

  const toggleDeleteButton = (commentId) => {
    setShowDelete(showDelete === commentId ? null : commentId);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="sns_modal" onClick={onModalOutsideClick}>
      <button onClick={onClose} className="close-button">Close</button>
      <div className="sns_modal-content">
        <div className="sns-modal-container">
          <div className="post-image-container">
            {post.imageUrls?.length > 0 && (
              <ImageGalleryComponent imageUrls={post.imageUrls} />
            )}
          </div>
          <div className="post-info-container">
            {isUserPostOwner && (
              <button ref={menuButtonRef} onClick={openMenuModal} className="menu-button">⋮</button>
            )}
            {isMenuModalOpen && (
              <div ref={menuModalRef} className="menu-modal">
                <ul>
                  <li onClick={() => setIsConfirmModalOpen(true)}>게시글 삭제</li>
                  <li onClick={handleEditButtonClick}>게시글 수정</li>
                </ul>
              </div>
            )}
            {isEditModalOpen && (
              <EditModal
                imageUrls={post.imageUrls}
                content={editedContent}
                tags={editedTags}
                onContentChange={setEditedContent}
                onTagsChange={(newTags) => setEditedTags(newTags)}
                onSave={updatePost}
                onClose={() => setIsEditModalOpen(false)}
              />
            )}
            <ConfirmModal
              isOpen={isConfirmModalOpen}
              onConfirm={() => {
                setIsConfirmModalOpen(false);
                deletePost();
              }}
              onCancel={() => setIsConfirmModalOpen(false)}
            />
            <div className="post-info">
              <div className="post-author">
                <img
                  src="/images/profile-placeholder.png"
                  alt="프로필 이미지"
                  className="sns-profile-img"
                />
                <Link to={`/profile/${post.createdBy}`} className="author-link">
                  &nbsp; {post.createdBy}님
                </Link>
              </div>
              <div className="post-content">
                {post.snsPostContent.length <= 70 ? (
                  post.snsPostContent
                ) : showFullContent ? (
                  post.snsPostContent
                ) : (
                  <>
                    {post.snsPostContent.slice(0, 70)}...{" "}
                    <button onClick={() => setShowFullContent(true)}>더보기</button>
                  </>
                )}
                {showFullContent && (
                  <button onClick={() => setShowFullContent(false)}>숨기기</button>
                )}
              </div>
              <div className="hashtags">
                {post.hashTags && post.hashTags.map((tag, index) => (
                  <span key={index} className="hashtag">#{tag}</span>
                ))}
              </div>
            </div>
            <div className="comments-container">
              <div className="comments-header">댓글</div>
              <div className="comments-list">
                {comments && comments.map(comment => (
                  <div key={comment.id} className="comment">
                    <div className="comment-text">
                      <div className="comment-author">
                        <img
                          src="/images/profile-placeholder.png"
                          alt="Profile"
                          className="sns-profile-img"
                        /> &nbsp;&nbsp;
                        <Link to={`/profile/${comment.createdBy}`} className="author-link">
                          {comment.createdBy}</Link> <span className="post-time">{getTimeSince(comment.createdAt)}</span>
                        {(loggedInUser === comment.createdBy || loggedInUser === post.createdBy) && (
                          <button onClick={() => toggleDeleteButton(comment.id)} className="comment-menu-button">⋮</button>
                        )}
                        {showDelete === comment.id && (
                          <button onClick={() => deleteComment(comment.id)} className="delete-comment-button">🗑️</button>
                        )}
                      </div>
                      <div className="comment-content">{comment.content}</div>
                    </div>
                    {comment.children && comment.children.length > 0 && (
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className={`reply-button ${repliesVisible[comment.id] ? 'active' : ''}`}
                      >
                        {repliesVisible[comment.id] ? '숨기기' : '답글 보기'}
                      </button>
                    )}
                    <button
                      onClick={() => handleReply(comment.createdBy, comment.id)}
                      className="reply-button">답글 달기</button>
                    {repliesVisible[comment.id] && (
                      <div className="replies">
                        {comment.children.map(reply => (
                          <div key={reply.id} className="reply">
                            <div className="reply-text">
                              <div className="reply-author">
                                <img
                                  src="/images/profile-placeholder.png"
                                  alt="Profile"
                                  className="sns-profile-img"
                                /> &nbsp;&nbsp;
                                <Link to={`/profile/${reply.createdBy}`} className="author-link">{reply.createdBy}</Link>
                              </div>
                              <div className="reply-content">{reply.content}</div>
                              <div className="reply-date">{getTimeSince(reply.createdAt)}</div>
                              <button
                                onClick={() => handleReply(reply.createdBy, comment.id)}
                                className="reply-button">Reply</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="sns-comments-input-divider"></div>
              <div className="sns-comment-input-container">
                <input
                  ref={commentInputRef}
                  type="text"
                  placeholder="Add a comment..."
                  className="sns-comment-input"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                />
                <button
                  className="sns-post-comment-button"
                  onClick={() => saveComment(post.id, loggedInUser, selectedCommentId)}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalComponent;
