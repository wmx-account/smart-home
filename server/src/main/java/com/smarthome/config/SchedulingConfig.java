package com.smarthome.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

/**
 * 定时任务配置：开启 @Scheduled，并提供独立调度线程池。
 * 默认 @Scheduled 单线程串行，设备线有多个周期/定时任务——Mock 物理推进 tick、SSE 广播、
 * 时序数据入库、超期数据清理，放到 5 个线程避免相互阻塞；线程名带 device-sched 前缀，便于排查。
 * 这也是设备线「多线程/并发」的真实落点之一。
 */
@Configuration
@EnableScheduling
public class SchedulingConfig {

    @Bean
    public ThreadPoolTaskScheduler threadPoolTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(5);
        scheduler.setThreadNamePrefix("device-sched-");
        scheduler.setWaitForTasksToCompleteOnShutdown(true);
        scheduler.setAwaitTerminationSeconds(10);
        return scheduler;
    }
}
