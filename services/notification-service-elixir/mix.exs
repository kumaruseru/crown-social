defmodule CrownNotificationService.MixProject do
  use Mix.Project

  def project do
    [
      app: :crown_notification_service,
      version: "1.0.0",
      elixir: "~> 1.15",
      start_permanent: Mix.env() == :prod,
      deps: deps()
    ]
  end

  def application do
    [
      extra_applications: [:logger, :runtime_tools],
      mod: {CrownNotificationService.Application, []}
    ]
  end

  defp deps do
    [
      {:phoenix, "~> 1.7.7"},
      {:phoenix_live_dashboard, "~> 0.8.0"},
      {:telemetry_metrics, "~> 0.6"},
      {:telemetry_poller, "~> 1.0"},
      {:jason, "~> 1.4"},
      {:plug_cowboy, "~> 2.5"},
      {:cors_plug, "~> 3.0"},
      {:mongodb, "~> 0.8.0"},
      {:redix, "~> 1.2"},
      {:phoenix_pubsub, "~> 2.1"},
      {:websockex, "~> 0.4"},
      {:httpoison, "~> 2.0"},
      {:poison, "~> 5.0"},
      {:timex, "~> 3.7"},
      {:quantum, "~> 3.0"},
      {:gen_stage, "~> 1.2"},
      {:flow, "~> 1.2"},
      {:broadway, "~> 1.0"},
      {:ex_aws, "~> 2.4"},
      {:ex_aws_sns, "~> 2.3"},
      {:swoosh, "~> 1.11"},
      {:gen_smtp, "~> 1.2"},
      {:phoenix_live_view, "~> 0.19.0"},
      {:floki, ">= 0.30.0", only: :test},
      {:phoenix_html, "~> 3.3"},
      {:phoenix_live_reload, "~> 1.2", only: :dev},
      {:gettext, "~> 0.20"},
      {:dns_cluster, "~> 0.1.1"},
      {:bandit, "~> 1.0"}
    ]
  end
end
