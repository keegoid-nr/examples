module TestModule
    class App
        def self.handler(event:, context:)
            if event['raise_error']
              puts "Forced unhandled error"
              raise "Forced unhandled error"
            else
              begin
                # Simulate some work
                if rand > 0.7
                  raise "Random handled error"
                end
                puts "Hello, world!"
                puts "Event size: #{event.size}"
                { statusCode: 200, body: JSON.generate("Hello from Ruby Lambda!") }
              rescue => e
                NewRelic::Agent.notice_error(e)
                puts "Handled error: #{e.message}"
                { statusCode: 500, body: "Handled error: #{e.message}" }
              end
            end
        end
    end
end