import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@/services/socketClient';
import { toast } from 'sonner';

export function useRealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();

    // ─── 1. Campaign Events ───
    const handleCampaignStatsUpdated = (data: { campaignId: string; amount: number }) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', data.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-supporters', data.campaignId] });
    };

    const handleCampaignUpdated = (campaign: any) => {
      queryClient.invalidateQueries({ queryKey: ['campaign', campaign?._id || campaign?.id] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
    };

    const handleCampaignCreated = () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    };

    // ─── 2. Donation & Payment Events ───
    const handleDonationSuccess = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-donations'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', data.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-donations'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['ngo-donations'] });
      queryClient.invalidateQueries({ queryKey: ['campaign-supporters', data.campaignId] });
    };

    // ─── 3. Wishlist Concurrency Events ───
    const handleWishlistItemUpdated = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['all-wishlist'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist-items'] });
      queryClient.invalidateQueries({ queryKey: ['my-item-donations'] });
    };

    // ─── 4. Volunteer Opportunities & Application Events ───
    const handleApplicationUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['my-volunteer-apps'] });
      queryClient.invalidateQueries({ queryKey: ['ngo-volunteer-apps'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-opps'] });
    };

    // ─── 5. NGO Verification & Status Events ───
    const handleNgoVerificationApproved = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['my-ngo-profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-ngos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ngos'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Your organization is verified! You can now launch campaigns.');
    };

    const handleNgoVerificationRejected = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['my-ngo-profile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-pending-ngos'] });
      toast.error(`Verification update: ${data.notes || 'Please resubmit documents'}`);
    };

    // ─── 6. Personal User Notifications ───
    const handleNotificationCreated = (notification: any) => {
      queryClient.invalidateQueries({ queryKey: ['my-notifications'] });
      toast.info(notification.title || 'New Notification', {
        description: notification.message,
      });
    };

    const handleUserStatusChanged = (data: { status: string }) => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.info(`Account status updated: ${data.status}`);
    };

    // ─── 7. Admin Real-Time Events ───
    const handleAdminStatsUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });
      queryClient.invalidateQueries({ queryKey: ['admin-donations'] });
    };

    // Register listeners
    socket.on('campaign.stats.updated', handleCampaignStatsUpdated);
    socket.on('campaign.updated', handleCampaignUpdated);
    socket.on('campaign.created', handleCampaignCreated);
    socket.on('donation.success', handleDonationSuccess);
    socket.on('wishlist.item.updated', handleWishlistItemUpdated);
    socket.on('application.approved', handleApplicationUpdated);
    socket.on('application.rejected', handleApplicationUpdated);
    socket.on('ngo.verification.approved', handleNgoVerificationApproved);
    socket.on('ngo.verification.rejected', handleNgoVerificationRejected);
    socket.on('notification.created', handleNotificationCreated);
    socket.on('user.status.changed', handleUserStatusChanged);
    socket.on('admin:stats.updated', handleAdminStatsUpdated);

    // Re-fetch critical state after reconnect
    const handleReconnect = () => {
      queryClient.invalidateQueries();
    };
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('campaign.stats.updated', handleCampaignStatsUpdated);
      socket.off('campaign.updated', handleCampaignUpdated);
      socket.off('campaign.created', handleCampaignCreated);
      socket.off('donation.success', handleDonationSuccess);
      socket.off('wishlist.item.updated', handleWishlistItemUpdated);
      socket.off('application.approved', handleApplicationUpdated);
      socket.off('application.rejected', handleApplicationUpdated);
      socket.off('ngo.verification.approved', handleNgoVerificationApproved);
      socket.off('ngo.verification.rejected', handleNgoVerificationRejected);
      socket.off('notification.created', handleNotificationCreated);
      socket.off('user.status.changed', handleUserStatusChanged);
      socket.off('admin:stats.updated', handleAdminStatsUpdated);
      socket.off('reconnect', handleReconnect);
    };
  }, [queryClient]);
}
