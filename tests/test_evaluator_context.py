import asyncio
import asyncio
import os
import tempfile
import unittest
import shutil

from openevolve.config import EvaluatorConfig
from openevolve.evaluator import Evaluator


class TestEvaluatorContext(unittest.TestCase):
    """Ensure evaluator receives user context"""

    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.eval_file = tempfile.NamedTemporaryFile(delete=False, suffix=".py", dir=self.temp_dir)
        self.eval_file.write(b"def evaluate(program_path, context):\n    return {'received': context.get('key')}\n")
        self.eval_file.flush()

    def tearDown(self):
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_context_passed(self):
        async def run_test():
            config = EvaluatorConfig()
            evaluator = Evaluator(config, self.eval_file.name, context={'key': 'value'})
            result = await evaluator.evaluate_program("print('hi')", "test")
            self.assertEqual(result.get('received'), 'value')

        asyncio.run(run_test())


if __name__ == "__main__":
    unittest.main()
