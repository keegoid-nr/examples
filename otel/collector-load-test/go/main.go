// ------------------------------------------------------
// Generate random metrics to load test OTel collector.
//
// Author : Keegan Mullaney
// Company: New Relic
// Website: github.com/keegoid-nr/examples/otel/collector-load-test
// License: Apache 2.0
// ------------------------------------------------------

package main

import (
  "context"
  "log"
  "math/rand"
  "os"
  "os/signal"
  "strconv"
  "sync/atomic"
  "time"

  // "github.com/shirou/gopsutil/cpu"

  "go.opentelemetry.io/contrib/instrumentation/runtime"
  "go.opentelemetry.io/otel"
  "go.opentelemetry.io/otel/attribute"
  "go.opentelemetry.io/otel/exporters/otlp/otlpmetric/otlpmetricgrpc"
  "go.opentelemetry.io/otel/sdk/metric"
  "go.opentelemetry.io/otel/sdk/resource"

  api "go.opentelemetry.io/otel/metric"
  semconv "go.opentelemetry.io/otel/semconv/v1.24.0"
)

const meterName = "github.com/keegoid-nr/examples/otel/collector-load-test"

// Declare a global variable for the total number of data points generated
var globalDataPointsGenerated int64 = 0

var res = resource.NewWithAttributes(
	semconv.SchemaURL,
  semconv.ServiceName("collector-load-test"),
  semconv.ServiceVersion("0.1.0"),
  semconv.ServiceInstanceID("go-app-1"),
)

func main() {
  log.Println("Application is starting...")

	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

  // Configure OTLP Exporter
  exp, err := otlpmetricgrpc.New(ctx)
  if err != nil {
    log.Fatalf("failed to create exporter: %v\n", err)
  }

	// Register the exporter with an SDK via a periodic reader.
	read := metric.NewPeriodicReader(exp, metric.WithInterval(5*time.Second))
	provider := metric.NewMeterProvider(metric.WithResource(res), metric.WithReader(read))
	defer func() {
		err := provider.Shutdown(context.Background())
		if err != nil {
			log.Fatal(err)
		}
	}()
	otel.SetMeterProvider(provider)

	log.Println("Starting runtime instrumentation:")
	err = runtime.Start(runtime.WithMinimumReadMemStatsInterval(1*time.Second))
	if err != nil {
		log.Fatal(err)
	}

  // Start metric generation
  go generateMetrics(ctx, provider.Meter(meterName))
}

func generateMetrics(ctx context.Context, meter api.Meter) {
  // Add a ticker to print metrics per second every 5 seconds
  ticker := time.NewTicker(5 * time.Second)
  defer ticker.Stop()

  // Initialize metrics
  durationHistogram, err := meter.Float64Histogram("http.server.duration", api.WithDescription("HTTP durations"), api.WithUnit("ms"))
  if err != nil {
    log.Fatalf("failed to create durationHistogram: %v\n", err)
  }

  httpRequestsCounter, err := meter.Int64Counter("http.request.count", api.WithDescription("count of HTTP requests"), api.WithUnit("requests"))
  if err != nil {
    log.Fatalf("failed to create httpRequestsCounter: %v\n", err)
  }

  errorRateGauge, err := meter.Float64ObservableGauge("http.error.rate", api.WithDescription("rate of HTTP errors"))
  if err != nil {
    log.Fatalf("failed to create errorRateGauge: %v\n", err)
  }

  // heapSysGauge, err := meter.Int64ObservableGauge("process.runtime.go.mem.heap_sys", api.WithDescription("memory heap_sys"), api.WithUnit("bytes"))
  // if err != nil {
  //   log.Fatalf("failed to create heapSysGauge: %v\n", err)
  // }

  // heapAllocGauge, err := meter.Int64ObservableGauge("process.runtime.go.mem.heap_alloc", api.WithDescription("memory heap_alloc"), api.WithUnit("bytes"))
  // if err != nil {
  //   log.Fatalf("failed to create heapAllocGauge: %v\n", err)
  // }

  // gcHistogram, err := meter.Int64Histogram("process.runtime.go.gc.pause_ns", api.WithDescription("GC pause durations"), api.WithUnit("ns"))
  // if err != nil {
  //   log.Fatalf("failed to create durationHistogram: %v\n", err)
  // }

  // goRoutinesGauge, err := meter.Int64ObservableGauge("process.runtime.go.goroutines", api.WithDescription("number of go routines"))
  // if err != nil {
  //   log.Fatalf("failed to create goRoutinesGauge: %v\n", err)
  // }

  // cpuUtilizationGauge, err := meter.Float64ObservableGauge("system.cpu.utilization", api.WithDescription("cpu utilization"), api.WithUnit("percent"))
  // if err != nil {
  //   log.Fatalf("failed to create cpuUtilizationGauge: %v\n", err)
  // }

  // Initialize HTTP methods and status codes
  httpMethods := []string{"GET", "POST", "PUT", "DELETE"}
  statusCodes := []int{200, 201, 202, 204, 400, 401, 403, 404, 500, 502, 503, 504}

  // Read metrics per second from the environment variable and calculate sleep duration
  metricsPerSecondEnv := os.Getenv("METRICS_PER_SECOND")
  metricsPerSecond, err := strconv.Atoi(metricsPerSecondEnv)
  if err != nil || metricsPerSecond <= 0 {
    metricsPerSecond = 10
  }
  sleepDuration := time.Duration(1_000/metricsPerSecond) * time.Millisecond

  // Initialize variables for calculating metrics per second
  startTime := time.Now()
  desiredMetricsPerSecond := float64(metricsPerSecond)
  sleepDurationAdjustmentStep := 10 * time.Millisecond // Fixed sleep duration adjustment step

  // Metric generation loop
  for {
    // Generate metrics and labels
    statusCodeWeights := generateStatusCodeWeights(statusCodes)
    method := httpMethods[rand.Intn(len(httpMethods))]
    statusCode := weightedChoice(statusCodes, statusCodeWeights)
    labels := api.WithAttributes(
      attribute.Key("http.method").String(method),
      attribute.Key("http.status_code").Int(statusCode),
    )

    // Record metrics
    duration := rand.Float64() * 1_000
    durationHistogram.Record(ctx, duration, labels)
    httpRequestsCounter.Add(ctx, 1, labels)

    dataPointsGenerated := 2 // for durationHistogram and httpRequestsCounter

    if statusCode > 204 {
      errorRate := statusCodeWeights[findIndex(statusCodes, statusCode)]
      log.Printf("Status Code: %d, Error Rate: %0.6f\n", statusCode, errorRate)
      _, err = meter.RegisterCallback(func(_ context.Context, o api.Observer) error {
        o.ObserveFloat64(errorRateGauge, errorRate, labels)
        dataPointsGenerated++ // increment dataPointsGenerated for errorRateGauge
        return nil
      }, errorRateGauge)
      if err != nil {
        log.Fatalf("failed to observe errorRate: %v\n", err)
      }
    }

    // var m runtime.MemStats
    // runtime.ReadMemStats(&m)
    // fmt.Printf("Alloc = %v MiB", bToMb(m.Alloc))
    // fmt.Printf("\tTotalAlloc = %v MiB", bToMb(m.TotalAlloc))
    // fmt.Printf("\tSys = %v MiB", bToMb(m.Sys))
    // fmt.Printf("\tNumGC = %v\n", m.NumGC)
    // _, err = meter.RegisterCallback(func(_ context.Context, o api.Observer) error {
    //   o.ObserveInt64(heapSysGauge, int64(m.Sys), labels)
    //   return nil
    // }, heapSysGauge)
    // if err != nil {
    //   log.Fatalf("failed to observe m.Sys: %v\n", err)
    // }
    // _, err = meter.RegisterCallback(func(_ context.Context, o api.Observer) error {
    //   o.ObserveInt64(heapAllocGauge, int64(m.Alloc), labels)
    //   return nil
    // }, heapAllocGauge)
    // if err != nil {
    //   log.Fatalf("failed to observe m.Alloc: %v\n", err)
    // }

    // // Record the last GC pause duration
    // if len(m.PauseNs) > 0 {
    //   lastPauseNs := m.PauseNs[(m.NumGC+255)%256] // Most recent pause
    //   gcHistogram.Record(ctx, int64(lastPauseNs), labels)
    // }

    // // Get the number of goroutines that currently exist.
    // numGoroutines := runtime.NumGoroutine()
    // log.Printf("number of goroutines: %d\n", numGoroutines)
    // _, err = meter.RegisterCallback(func(_ context.Context, o api.Observer) error {
    //   o.ObserveInt64(goRoutinesGauge, int64(numGoroutines), labels)
    //   return nil
    // }, goRoutinesGauge)
    // if err != nil {
    //   log.Fatalf("failed to observe numGoroutines: %v\n", err)
    // }

    // cpuUtilization, _ := cpu.Percent(time.Second, false)
    // log.Printf("cpu utilization: %.2f%%\n", cpuUtilization[0])
    // _, err = meter.RegisterCallback(func(_ context.Context, o api.Observer) error {
    //   o.ObserveFloat64(cpuUtilizationGauge, cpuUtilization[0]/100, labels)
    //   return nil
    // }, cpuUtilizationGauge)
    // if err != nil {
    //   log.Fatalf("failed to observe cpuUtilization[0]: %v\n", err)
    // }

    // Update the global count of data points generated
    atomic.AddInt64(&globalDataPointsGenerated, int64(dataPointsGenerated))

    // Calculate the total elapsed time since the start of the process
    totalElapsedTime := time.Since(startTime).Seconds()

    // Calculate the actual metrics per second based on the global count
    actualMetricsPerSecond := float64(globalDataPointsGenerated) / totalElapsedTime

    // Adjust sleep duration
    sleepDuration = adjustSleepDuration(sleepDurationAdjustmentStep, desiredMetricsPerSecond, actualMetricsPerSecond, sleepDuration)

    // Sleep for the calculated duration
    time.Sleep(sleepDuration)

    select {
    case <-ticker.C:
      // Print the current metrics per second and sleep duration
      log.Printf("Metrics per second: %0.1f, Sleep duration: %v\n", actualMetricsPerSecond, sleepDuration)
    default:
      // Do nothing
    }

    // Sleep for the calculated duration
    time.Sleep(sleepDuration)
  }
}


func bToMb(b uint64) uint64 {
	return b / 1024 / 1024
}

func generateStatusCodeWeights(statusCodes []int) []float64 {
    firstStatusCodeWeight := 0.95
    remainingProbability := 1.0 - firstStatusCodeWeight
    var otherStatusCodeWeights []float64
    totalWeight := 0.0

    for i := 0; i < len(statusCodes)-1; i++ {
        weight := rand.Float64()
        otherStatusCodeWeights = append(otherStatusCodeWeights, weight)
        totalWeight += weight
    }

    // Normalize the other weights to ensure their sum is equal to the remaining probability
    for i := 0; i < len(statusCodes)-1; i++ {
        otherStatusCodeWeights[i] = otherStatusCodeWeights[i] / totalWeight * remainingProbability
    }

    return append([]float64{firstStatusCodeWeight}, otherStatusCodeWeights...)
}

func weightedChoice(choices []int, weights []float64) int {
  sum := 0.0
  for _, weight := range weights {
    sum += weight
  }

  r := rand.Float64() * sum
  for i, weight := range weights {
    r -= weight
    if r <= 0 {
      return choices[i]
    }
  }

  // Fallback in case of rounding issues, return last choice
  return choices[len(choices)-1]
}

func findIndex(arr []int, target int) int {
    for i, v := range arr {
        if v == target {
            return i
        }
    }
    return -1
}

func adjustSleepDuration(step time.Duration, desiredMetricsPerSecond, actualMetricsPerSecond float64, sleepDuration time.Duration) time.Duration {
	if actualMetricsPerSecond < desiredMetricsPerSecond {
		sleepDuration -= step
	} else {
		sleepDuration += step
	}

	// Ensure sleepDuration does not become negative
	if sleepDuration < 0 {
		sleepDuration = 0
	}

	return sleepDuration
}
