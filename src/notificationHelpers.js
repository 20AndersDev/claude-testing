import { supabase } from './supabaseClient';

/**
 * Create a notification in the database
 * @param {string} userId - The ID of the user receiving the notification
 * @param {string} type - Type of notification: 'like', 'comment', 'follow', 'follow_request', 'follow_accept', 'tag'
 * @param {string} actorId - The ID of the user performing the action
 * @param {string} actorName - The name of the user performing the action
 * @param {string|null} postId - The ID of the related post (if applicable)
 * @param {string|null} commentText - The comment text preview (if applicable)
 * @param {string|null} requestId - The ID of the follow request (if applicable)
 */
export async function createNotification(userId, type, actorId, actorName, postId = null, commentText = null, requestId = null) {
  try {
    // Don't create notification if user is acting on their own content
    if (userId === actorId) {
      return;
    }

    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type: type,
        actor_id: actorId,
        actor_name: actorName,
        post_id: postId,
        comment_text: commentText,
        request_id: requestId,
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating notification:', error);
    }
  } catch (error) {
    console.error('Error in createNotification:', error);
  }
}

/**
 * Create a follow notification
 */
export async function createFollowNotification(followedUserId, followerId, followerName) {
  await createNotification(followedUserId, 'follow', followerId, followerName);
}

/**
 * Create a like notification
 */
export async function createLikeNotification(postOwnerId, likerId, likerName, postId) {
  await createNotification(postOwnerId, 'like', likerId, likerName, postId);
}

/**
 * Create a comment notification
 */
export async function createCommentNotification(postOwnerId, commenterId, commenterName, postId, commentText) {
  await createNotification(postOwnerId, 'comment', commenterId, commenterName, postId, commentText);
}

/**
 * Create a tag notification
 */
export async function createTagNotification(taggedUserId, taggerId, taggerName, postId) {
  await createNotification(taggedUserId, 'tag', taggerId, taggerName, postId);
}

/**
 * Create a follow request notification
 */
export async function createFollowRequestNotification(requestedUserId, requesterId, requesterName, requestId) {
  await createNotification(requestedUserId, 'follow_request', requesterId, requesterName, null, null, requestId);
}

/**
 * Create a follow request accepted notification
 */
export async function createFollowAcceptNotification(requesterId, accepterId, accepterName) {
  await createNotification(requesterId, 'follow_accept', accepterId, accepterName);
}
