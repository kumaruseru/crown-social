defmodule CrownNotificationService.NotificationWorker do
  @moduledoc """
  High-performance notification processing worker using GenStage
  Handles real-time notifications, push notifications, emails, and WebSocket broadcasts
  """
  
  use GenStage
  alias CrownNotificationService.{Notification, EmailService, PushService, WebSocketManager}
  require Logger

  def start_link(opts) do
    GenStage.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def init(_opts) do
    Logger.info("🔔 Notification Worker started")
    {:producer_consumer, %{}, subscribe_to: [CrownNotificationService.NotificationPipeline]}
  end

  def handle_events(events, _from, state) do
    processed_events = 
      events
      |> Flow.from_enumerable()
      |> Flow.map(&process_notification/1)
      |> Flow.partition()
      |> Flow.map(&send_notification/1)
      |> Enum.to_list()

    {:noreply, processed_events, state}
  end

  defp process_notification(%{type: type, user_id: user_id, data: data} = notification) do
    Logger.info("Processing #{type} notification for user #{user_id}")
    
    case type do
      "real_time" -> process_real_time_notification(notification)
      "push" -> process_push_notification(notification)
      "email" -> process_email_notification(notification)
      "sms" -> process_sms_notification(notification)
      "in_app" -> process_in_app_notification(notification)
      _ -> {:error, "Unknown notification type: #{type}"}
    end
  end

  defp process_real_time_notification(%{user_id: user_id, data: data}) do
    # Send real-time WebSocket notification
    WebSocketManager.broadcast_to_user(user_id, %{
      type: "notification",
      timestamp: DateTime.utc_now(),
      data: data
    })
    
    {:ok, :real_time_sent}
  end

  defp process_push_notification(%{user_id: user_id, data: data}) do
    # Send push notification to mobile devices
    PushService.send_push_notification(user_id, %{
      title: data.title || "Crown Notification",
      body: data.message,
      icon: data.icon || "/images/crown-icon.png",
      badge: data.badge || 1,
      sound: data.sound || "default",
      click_action: data.click_action || "/notifications"
    })
  end

  defp process_email_notification(%{user_id: user_id, data: data}) do
    # Send email notification
    EmailService.send_notification_email(user_id, %{
      subject: data.subject || "Crown Notification",
      template: data.template || "notification",
      variables: data.variables || %{},
      priority: data.priority || "normal"
    })
  end

  defp process_sms_notification(%{user_id: user_id, data: data}) do
    # Send SMS notification (placeholder - would integrate with Twilio/AWS SNS)
    Logger.info("SMS notification for user #{user_id}: #{data.message}")
    {:ok, :sms_sent}
  end

  defp process_in_app_notification(%{user_id: user_id, data: data}) do
    # Store in-app notification in database
    notification_data = %{
      user_id: user_id,
      type: "in_app",
      title: data.title,
      message: data.message,
      read: false,
      created_at: DateTime.utc_now(),
      metadata: data.metadata || %{}
    }
    
    # Store in Redis for fast access
    Redix.command(:redix, ["LPUSH", "notifications:#{user_id}", Poison.encode!(notification_data)])
    Redix.command(:redix, ["EXPIRE", "notifications:#{user_id}", 86400 * 30]) # 30 days
    
    {:ok, :in_app_stored}
  end

  defp send_notification({:ok, result}) do
    Logger.debug("Notification sent successfully: #{inspect(result)}")
    result
  end

  defp send_notification({:error, reason}) do
    Logger.error("Failed to send notification: #{inspect(reason)}")
    {:error, reason}
  end
end
