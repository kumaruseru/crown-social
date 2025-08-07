defmodule CrownNotificationService.Application do
  @moduledoc false

  use Application

  @impl true
  def start(_type, _args) do
    children = [
      # Telemetry supervisor
      CrownNotificationServiceWeb.Telemetry,
      
      # PubSub system
      {Phoenix.PubSub, name: CrownNotificationService.PubSub},
      
      # Database connections
      {Redix, host: System.get_env("REDIS_HOST", "localhost"), port: 6379, name: :redix},
      
      # Notification workers
      CrownNotificationService.NotificationWorker,
      CrownNotificationService.EmailWorker,
      CrownNotificationService.PushWorker,
      CrownNotificationService.WebSocketManager,
      
      # Quantum Scheduler for periodic tasks
      CrownNotificationService.Scheduler,
      
      # Broadway for message processing
      CrownNotificationService.NotificationPipeline,
      
      # Phoenix Endpoint
      CrownNotificationServiceWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: CrownNotificationService.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    CrownNotificationServiceWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
