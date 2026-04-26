package com.edu.kompot.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.*;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class LoggingAspect {

	@Pointcut("execution(* com.edu.kompot.controller.*.*(..))")
	public void controllerMethods() {
	}

	@Pointcut("execution(* com.edu.kompot.service.*.*(..))")
	public void serviceMethods() {
	}

	@Before("controllerMethods()")
	public void logBeforeController(JoinPoint joinPoint) {
		log.debug("Entering method: {} with arguments: {}", joinPoint.getSignature().toShortString(), joinPoint.getArgs());
	}

	@AfterReturning(pointcut = "controllerMethods()", returning = "result")
	public void logAfterController(JoinPoint joinPoint, Object result) {
		log.debug("Exiting method: {} with result: {}", joinPoint.getSignature().toShortString(), result);
	}

	@Around("serviceMethods()")
	public Object logExecutionTime(ProceedingJoinPoint joinPoint) throws Throwable {
		long start = System.currentTimeMillis();
		Object proceed = joinPoint.proceed();
		long executionTime = System.currentTimeMillis() - start;
		log.debug("Method {} executed in {} ms", joinPoint.getSignature().toShortString(), executionTime);
		return proceed;
	}

	@AfterThrowing(pointcut = "controllerMethods() || serviceMethods()", throwing = "exception")
	public void logException(JoinPoint joinPoint, Exception exception) {
		log.error("Exception in method: {} with message: {}", joinPoint.getSignature().toShortString(), exception.getMessage());
	}
}










