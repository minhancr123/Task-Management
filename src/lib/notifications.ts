
import { supabase } from "./supabase";

type NotificationType = 'task_assigned' | 'task_updated' | 'comment_added' | 'leave_status' | 'approval_needed' | 'mention' | 'system';

interface CreateNotificationParams {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    entityType?: string;
    entityId?: string;
    senderId?: string; // Optional, to avoid notifying self
}

/**
 * Creates a new notification for a user.
 * Checks if the recipient is the same as the sender to avoid self-notifications.
 */
export async function createNotification({
    userId,
    title,
    message,
    type,
    entityType,
    entityId,
    senderId
}: CreateNotificationParams) {
    if (senderId && userId === senderId) return; // Don't notify self

    try {
        const { error } = await supabase.from("notifications").insert({
            user_id: userId,
            title,
            message,
            type,
            entity_type: entityType,
            entity_id: entityId,
            is_read: false,
        });

        if (error) {
            console.error("Error creating notification:", error);
        }
    } catch (err) {
        console.error("Exception creating notification:", err);
    }
}

/**
 * Creates notifications for multiple users (e.g. team members)
 */
export async function createBatchNotifications(
    userIds: string[],
    params: Omit<CreateNotificationParams, "userId">
) {
    const validUserIds = params.senderId
        ? userIds.filter(id => id !== params.senderId)
        : userIds;

    if (validUserIds.length === 0) return;

    try {
        const notifications = validUserIds.map(userId => ({
            user_id: userId,
            title: params.title,
            message: params.message,
            type: params.type,
            entity_type: params.entityType,
            entity_id: params.entityId,
            is_read: false,
        }));

        const { error } = await supabase.from("notifications").insert(notifications);

        if (error) {
            console.error("Error creating batch notifications:", error);
        }
    } catch (err) {
        console.error("Exception creating batch notifications:", err);
    }
}
